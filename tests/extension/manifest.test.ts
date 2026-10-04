import * as fs from 'fs';
import * as path from 'path';

describe('Manifest V3 Compliance (extension/manifest.json)', () => {
  const manifestPath = path.resolve(__dirname, '../../extension/manifest.json');
  let manifest: any;

  beforeAll(() => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(raw);
  });

  it('declares manifest_version: 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('defines valid name, version, and description', () => {
    expect(manifest.name).toBe('Auto-Gifter');
    expect(typeof manifest.version).toBe('string');
    expect(manifest.version.length).toBeGreaterThan(0);
    expect(typeof manifest.description).toBe('string');
  });

  it('requests the "storage" permission for settings and sync', () => {
    expect(Array.isArray(manifest.permissions)).toBe(true);
    expect(manifest.permissions).toContain('storage');
  });

  it('declares required host permissions for Google Calendar and GAS redirects', () => {
    expect(Array.isArray(manifest.host_permissions)).toBe(true);
    expect(manifest.host_permissions).toContain('https://calendar.google.com/*');
    expect(manifest.host_permissions).toContain('https://script.google.com/*');
    expect(manifest.host_permissions).toContain('https://script.googleusercontent.com/*');
  });

  it('configures content scripts for calendar.google.com with core engine and styling', () => {
    expect(Array.isArray(manifest.content_scripts)).toBe(true);
    expect(manifest.content_scripts.length).toBeGreaterThan(0);

    const script = manifest.content_scripts[0];
    expect(script.matches).toContain('https://calendar.google.com/*');
    expect(script.js).toContain('core/CoreEngine.js');
    expect(script.js).toContain('content/content.js');
    expect(script.css).toContain('content/content.css');
  });

  it('configures the action default_popup to popup/popup.html', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.action.default_popup).toBe('popup/popup.html');
    expect(manifest.action.default_title).toBe('Auto-Gifter');
  });

  it('references existing icon asset files', () => {
    expect(manifest.icons).toBeDefined();
    const sizes = ['16', '32', '48', '128'];
    for (const size of sizes) {
      if (manifest.icons[size]) {
        const iconFile = path.resolve(__dirname, '../../extension', manifest.icons[size]);
        expect(fs.existsSync(iconFile)).toBe(true);
      }
    }
  });
});
