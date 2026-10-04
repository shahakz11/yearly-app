import * as fs from 'fs';
import * as path from 'path';
import { UpcomingCelebration } from './types';

/**
 * In-Memory Chrome Storage Sync Mock & Demo Mode Controller
 * Conforming to PROJECT.md § Interface Contracts #5
 */
export class ChromeStorageMock {
  private storage: Record<string, any> = {};

  public async get(keys: string[] | string): Promise<Record<string, any>> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, any> = {};
    for (const k of keyList) {
      if (this.storage[k] !== undefined) {
        result[k] = this.storage[k];
      }
    }
    return result;
  }

  public async set(items: Record<string, any>): Promise<void> {
    for (const [k, v] of Object.entries(items)) {
      this.storage[k] = v;
    }
  }

  public async clear(): Promise<void> {
    this.storage = {};
  }

  /**
   * Resolves celebration events:
   * If gasWebAppUrl is configured and reachable -> fetches from GAS
   * Otherwise falls back gracefully to demoCelebrations.json without throwing
   */
  public async loadCelebrations(
    gasFetcher?: (url: string) => Promise<UpcomingCelebration[]>
  ): Promise<{ source: 'gas' | 'demo'; celebrations: UpcomingCelebration[] }> {
    const { gasWebAppUrl } = await this.get('gasWebAppUrl');

    if (gasWebAppUrl && gasFetcher) {
      try {
        const events = await gasFetcher(gasWebAppUrl);
        return { source: 'gas', celebrations: events };
      } catch (err) {
        // Fallback to demo mode on network/GAS failure
      }
    }

    // Load demo celebrations fixture
    const demoFixturePath = path.resolve(__dirname, '../fixtures/demoCelebrations.json');
    const demoContent = fs.readFileSync(demoFixturePath, 'utf-8');
    const demoEvents: UpcomingCelebration[] = JSON.parse(demoContent);

    return {
      source: 'demo',
      celebrations: demoEvents,
    };
  }
}

/**
 * Chrome Extension Manifest V3 Compliance Validator
 */
export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateExtensionManifest(manifest: any): ManifestValidationResult {
  const errors: string[] = [];

  if (manifest.manifest_version !== 3) {
    errors.push(`Expected manifest_version: 3, got: ${manifest.manifest_version}`);
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Manifest missing valid name');
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Manifest missing valid version');
  }

  if (!Array.isArray(manifest.permissions) || !manifest.permissions.includes('storage')) {
    errors.push('Manifest must request "storage" permission');
  }

  const hosts: string[] = manifest.host_permissions || [];
  const hasCalendarHost = hosts.some((h: string) => h.includes('calendar.google.com'));
  if (!hasCalendarHost) {
    errors.push('Manifest host_permissions must include calendar.google.com');
  }

  if (!manifest.action || !manifest.action.default_popup) {
    errors.push('Manifest must define action.default_popup');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
