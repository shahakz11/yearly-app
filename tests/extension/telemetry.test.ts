import * as path from 'path';

describe('Chrome Extension Telemetry Suite (extension/core/telemetry.js)', () => {
  let mockStorageStore: Record<string, any> = {};
  let Telemetry: any;

  beforeEach(() => {
    mockStorageStore = {};

    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn((keys: string[], callback: (res: any) => void) => {
            const result: Record<string, any> = {};
            keys.forEach(k => {
              if (mockStorageStore[k] !== undefined) {
                result[k] = mockStorageStore[k];
              }
            });
            callback(result);
          }),
          set: jest.fn((items: Record<string, any>, callback?: () => void) => {
            Object.assign(mockStorageStore, items);
            if (callback) callback();
          })
        }
      }
    };

    Telemetry = require('../../extension/core/telemetry.js');
    Telemetry.clearStoredLogs();
  });

  afterEach(() => {
    delete (global as any).chrome;
  });

  it('generates structured log entries with traceId and metadata', () => {
    const entry = Telemetry.log('INFO', 'ContentScript', 'Injected badge for event', {
      recipient: 'Alex',
      confidence: 0.95
    });

    expect(entry).toBeDefined();
    expect(entry.traceId).toBeDefined();
    expect(entry.severity).toBe('INFO');
    expect(entry.component).toBe('ContentScript');
    expect(entry.message).toBe('Injected badge for event');
    expect(entry.meta.recipient).toBe('Alex');
  });

  it('captures errors and normalizes stack trace', () => {
    const testErr = new Error('Selector not found');
    const entry = Telemetry.captureError('DOMInjector', testErr, { selector: '.event-chip' });

    expect(entry.severity).toBe('ERROR');
    expect(entry.error).toBeDefined();
    expect(entry.error.name).toBe('Error');
    expect(entry.error.message).toBe('Selector not found');
    expect(entry.error.stack).toBeDefined();
  });

  it('measures synchronous function duration and logs completion', () => {
    const result = Telemetry.measure('PerformanceTest', 'matrixMath', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(result).toBe(499500);
  });

  it('measures asynchronous promise duration and logs completion', async () => {
    const result = await Telemetry.measureAsync('AsyncTest', 'asyncOperation', async () => {
      return 'done';
    });

    expect(result).toBe('done');
  });

  it('buffers logs and persists them into chrome.storage.local', async () => {
    for (let i = 0; i < 6; i++) {
      Telemetry.log('INFO', 'TestBatch', `Message #${i}`);
    }

    await Telemetry.flush();
    const stored = await Telemetry.getStoredLogs();
    expect(stored.length).toBeGreaterThan(0);
    expect(mockStorageStore[Telemetry.LOGS_STORAGE_KEY]).toBeDefined();
  });

  it('exports diagnostic data as a valid formatted JSON string', async () => {
    Telemetry.log('ERROR', 'NetworkModule', 'Failed to reach FloristOne API');
    await Telemetry.flush();

    const jsonStr = await Telemetry.exportDiagnosticsJson();
    expect(typeof jsonStr).toBe('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.environment).toBeDefined();
    expect(parsed.logCount).toBeGreaterThan(0);
    expect(Array.isArray(parsed.logs)).toBe(true);
  });
});
