import {
  setupGasGlobals,
  resetGasGlobals,
  MockUrlFetchApp,
  MockPropertiesService,
  MockSpreadsheetApp,
  MockCalendarApp,
  MockCalendarEvent
} from './mocks/GasMocks';

setupGasGlobals();

const Observability = require('../Observability');
const SheetsLogger = require('../SheetsLogger');
const AddOn = require('../AddOn');
const WebApp = require('../WebApp');
const AutoGifterCore = require('../CoreEngine');

describe('Observability & Google Chat Alerting Suite (gas/Observability.js & gas/SheetsLogger.js)', () => {
  beforeEach(() => {
    resetGasGlobals();
    (global as any).AutoGifterCore = AutoGifterCore;
  });

  describe('1. Structured Logging & Error Capture', () => {
    it('creates structured log entry with traceId, timestamp, and severity', () => {
      const entry = Observability.log('INFO', 'TestComponent', 'Operation successful', { itemCount: 5 });
      expect(entry).toBeDefined();
      expect(entry.traceId).toBeDefined();
      expect(entry.severity).toBe('INFO');
      expect(entry.component).toBe('TestComponent');
      expect(entry.message).toBe('Operation successful');
      expect(entry.meta.itemCount).toBe(5);
    });

    it('measures execution time and logs duration on success and failure', () => {
      const result = Observability.measure('TestComponent', 'calculateSomething', () => {
        return 42;
      });
      expect(result).toBe(42);

      expect(() => {
        Observability.measure('TestComponent', 'failingOperation', () => {
          throw new Error('Simulation Failure');
        });
      }).toThrow('Simulation Failure');
    });
  });

  describe('2. Google Chat Webhook Dispatcher', () => {
    it('saves and retrieves Google Chat webhook URL via PropertiesService', () => {
      const testWebhook = 'https://chat.googleapis.com/v1/spaces/AAA/messages?key=123';
      Observability.setWebhookUrl(testWebhook);
      expect(Observability.getWebhookUrl()).toBe(testWebhook);
    });

    it('dispatches rich Card v2 webhook on ERROR and CRITICAL events when URL is configured', () => {
      const testWebhook = 'https://chat.googleapis.com/v1/spaces/AAA/messages?key=123';
      Observability.setWebhookUrl(testWebhook);

      Observability.log('ERROR', 'CelebrationScanner', 'Calendar quota reached', {}, new Error('QuotaExceeded'));

      expect(MockUrlFetchApp.requests.length).toBe(1);
      const req = MockUrlFetchApp.requests[0];
      expect(req.url).toBe(testWebhook);
      expect(req.params.method).toBe('post');

      const parsedBody = JSON.parse(req.params.payload);
      expect(parsedBody.cardsV2).toBeDefined();
      expect(parsedBody.cardsV2.length).toBe(1);
      expect(parsedBody.cardsV2[0].card.header.title).toContain('ERROR');
      expect(parsedBody.cardsV2[0].card.header.subtitle).toBe('gas_addon');
    });

    it('sendTestAlert sends test card and returns success status', () => {
      const testWebhook = 'https://chat.googleapis.com/v1/spaces/AAA/messages?key=123';
      const outcome = Observability.sendTestAlert(testWebhook);
      expect(outcome.success).toBe(true);
      expect(MockUrlFetchApp.requests.length).toBe(1);
    });
  });

  describe('3. SheetsLogger _SystemHealthLog Persistence', () => {
    it('provisions _SystemHealthLog sheet and records log entries', () => {
      const healthSheet = SheetsLogger.getOrCreateHealthSheet();
      expect(healthSheet).toBeDefined();
      expect(healthSheet.getName()).toBe('_SystemHealthLog');

      const entry = {
        traceId: 'tr_test1',
        timestamp: new Date().toISOString(),
        surface: 'gas_addon',
        severity: 'INFO',
        component: 'SyncService',
        message: 'Sync completed for 10 events',
        durationMs: 120
      };

      const recorded = SheetsLogger.recordHealthLog(entry);
      expect(recorded).toBe(true);

      const logs = SheetsLogger.getHealthLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].traceId).toBe('tr_test1');
      expect(logs[0].component).toBe('SyncService');
    });
  });

  describe('4. Google Workspace AddOn Settings & Actions Integration', () => {
    it('creates health & alert section in AddOn settings card', () => {
      const section = AddOn.createHealthAndAlertSettingsSection();
      expect(section).toBeDefined();
      const built = section.build();
      expect(built.header).toContain('Health');
    });

    it('onSaveAndTestChatWebhook updates webhook property and sends test alert', () => {
      const testWebhook = 'https://chat.googleapis.com/v1/spaces/AAA/messages?key=999';
      const event = {
        formInputs: {
          gchat_webhook: [testWebhook]
        }
      };

      const response = AddOn.onSaveAndTestChatWebhook(event);
      expect(response).toBeDefined();
      expect(Observability.getWebhookUrl()).toBe(testWebhook);
      expect(MockUrlFetchApp.requests.length).toBe(1);
    });

    it('onViewHealthLogsCard renders recent health logs card', () => {
      SheetsLogger.recordHealthLog({
        traceId: 'tr_view_test',
        severity: 'ERROR',
        component: 'CalendarEventOpen',
        message: 'Test failure log'
      });

      const card = AddOn.onViewHealthLogsCard({});
      expect(card).toBeDefined();
    });
  });

  describe('5. WebApp Telemetry & Diagnostic Endpoints', () => {
    it('doPost handles action=telemetry and records batch logs from Chrome Extension', () => {
      const telemetryBatch = {
        action: 'telemetry',
        logs: [
          {
            severity: 'ERROR',
            component: 'ContentScript',
            message: 'DOM injection selector failed',
            surface: 'extension_content'
          },
          {
            severity: 'WARN',
            component: 'Popup',
            message: 'Slow storage lookup',
            surface: 'extension_popup'
          }
        ]
      };

      const postEvent = {
        postData: {
          contents: JSON.stringify(telemetryBatch)
        }
      };

      const resp = WebApp.doPost(postEvent);
      expect(resp).toBeDefined();
      const body = JSON.parse(resp.getContent());
      expect(body.status).toBe('ok');
      expect(body.received).toBe(2);
    });

    it('doGet returns health logs with action=health_logs', () => {
      SheetsLogger.recordHealthLog({
        traceId: 'tr_get_test',
        severity: 'INFO',
        component: 'HealthEndpointTest',
        message: 'Health log check'
      });

      const getEvent = {
        parameter: {
          action: 'health_logs',
          limit: '5'
        }
      };

      const resp = WebApp.doGet(getEvent);
      expect(resp).toBeDefined();
      const body = JSON.parse(resp.getContent());
      expect(body.status).toBe('ok');
      expect(Array.isArray(body.logs)).toBe(true);
      expect(body.logs.length).toBeGreaterThan(0);
    });
  });
});
