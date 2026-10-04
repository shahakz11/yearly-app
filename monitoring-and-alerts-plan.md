# Monitoring, Error Tracing, and Google Chat Alerts Plan

## Goal
Implement a free, unified error tracing, performance monitoring, and Google Chat alerting system across both the Google Workspace Add-on (GAS) and Chrome Extension (MV3).

## Tasks
- [x] Task 1: Create `gas/Observability.js` with structured logging, performance timing (`measure`), and Google Chat Webhook Card v2 alert dispatcher → Verify: Unit tests verify log structure and `UrlFetchApp` dispatch payload formatting.
- [x] Task 2: Enhance `gas/SheetsLogger.js` with auto-provisioned `_SystemHealthLog` sheet logging and query helpers → Verify: Calling `recordHealthLog` creates and populates the `_SystemHealthLog` sheet with timestamped trace records.
- [x] Task 3: Integrate `Observability.js` into `gas/AddOn.js` across `onCalendarEventOpen`, `enrichCalendarEvent`, and background sync triggers (`autoSyncWeeklyTrigger`) → Verify: Errors and slow executions in AddOn cards trigger `Observability.log`.
- [x] Task 4: Add Google Chat Webhook configuration and "Export Health Logs" UI to `gas/AddOn.js` settings card → Verify: AddOn settings card renders webhook URL input, "Save & Test Alert" button, and "Export Health Logs" button.
- [x] Task 5: Add `action: 'telemetry'` endpoint in `gas/WebApp.js` (`doPost` / `doGet`) to ingest client-side error batches from the Chrome extension → Verify: POSTing error payload to `WebApp.js` records logs and forwards `CRITICAL`/`ERROR` entries to Google Chat.
- [x] Task 6: Create `extension/core/telemetry.js` to capture unhandled errors, measure DOM injection latency, and buffer telemetry into `chrome.storage.local` with periodic background sync → Verify: Content script and popup errors are safely caught and buffered without blocking the UI.
- [x] Task 7: Add "Export Diagnostics / Error Log" button and webhook status in `extension/popup/popup.html` and `popup.js` → Verify: Clicking "Export Diagnostics" in popup downloads a JSON dump of local diagnostic logs.
- [x] Task 8: Add unit and integration tests in `gas/__tests__/observability.test.ts` and `tests/extension/telemetry.test.ts` → Verify: Run `npm test` and ensure all 20+ test suites pass with 100% success.

## Done When
- [x] Google Workspace Add-on tracks card load latency and automatically sends a rich Card v2 alert to Google Chat on `ERROR`/`CRITICAL` events.
- [x] Chrome Extension buffers runtime errors, records DOM hook timings, and auto-flushes to GAS WebApp.
- [x] Both the Add-on and Extension provide an instant "Export Diagnostics / Error Log" feature for easy troubleshooting.
- [x] All tests pass via `npm test` without regressions.

## Notes
- Free-tier compliant: Uses native GAS quotas (`UrlFetchApp`, `PropertiesService`, Google Sheets) and Google Chat incoming webhooks with zero external paid dependencies.
- Strict PII Protection: Automatically sanitizes celebrant names and event details prior to webhook dispatch and health log storage.
