/**
 * Auto-Gifter Chrome Extension Telemetry & Error Tracing Engine (MV3 Compatible)
 *
 * Responsibilities:
 * - Captures unhandled runtime errors, rejection events, and custom error boundaries.
 * - Measures DOM injection latency and asynchronous task performance.
 * - Buffers structured logs in chrome.storage.local (capped to last 200 events).
 * - Periodically flushes error batches to the GAS WebApp telemetry endpoint if available.
 * - Provides export functionality for local diagnostic JSON downloads.
 */

(function (global) {
  var LOGS_STORAGE_KEY = 'autogifter_telemetry_logs';
  var MAX_STORED_LOGS = 200;
  var FLUSH_BATCH_SIZE = 5;
  var inMemoryBuffer = [];
  var isFlushing = false;

  function generateTraceId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 8);
    }
    return Math.random().toString(36).substring(2, 10);
  }

  function getChromeStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    }
    return null;
  }

  function log(severity, component, message, meta, error, surface) {
    var entry = {
      traceId: generateTraceId(),
      timestamp: new Date().toISOString(),
      surface: surface || (typeof window !== 'undefined' && window.location && window.location.href.indexOf('calendar.google.com') !== -1 ? 'extension_content' : 'extension_popup'),
      severity: severity || 'INFO',
      component: component || 'General',
      message: message || '',
      meta: meta || {}
    };

    if (meta && typeof meta.durationMs === 'number') {
      entry.durationMs = meta.durationMs;
    }

    if (error) {
      entry.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || null
      };
    }

    // Output to browser console
    var prefix = '[Auto-Gifter Telemetry]';
    if (severity === 'ERROR' || severity === 'CRITICAL') {
      console.error(prefix, entry);
    } else if (severity === 'WARN') {
      console.warn(prefix, entry);
    } else {
      console.log(prefix, entry);
    }

    bufferLog(entry);
    return entry;
  }

  function captureError(component, error, meta) {
    return log('ERROR', component, (error && error.message) || String(error), meta, error);
  }

  function measure(component, actionName, fn) {
    var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime();
    try {
      var result = fn();
      var duration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime()) - start);
      if (duration > 300) {
        log('WARN', component, actionName + ' completed with high latency (' + duration + 'ms)', { durationMs: duration });
      }
      return result;
    } catch (err) {
      var errDuration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime()) - start);
      log('ERROR', component, actionName + ' failed (' + errDuration + 'ms): ' + (err && err.message ? err.message : err), { durationMs: errDuration }, err);
      throw err;
    }
  }

  function measureAsync(component, actionName, asyncFn) {
    var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime();
    return Promise.resolve()
      .then(function () {
        return asyncFn();
      })
      .then(function (res) {
        var duration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime()) - start);
        if (duration > 500) {
          log('WARN', component, actionName + ' took ' + duration + 'ms (threshold: 500ms)', { durationMs: duration });
        }
        return res;
      })
      .catch(function (err) {
        var errDuration = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : new Date().getTime()) - start);
        log('ERROR', component, actionName + ' failed (' + errDuration + 'ms): ' + (err && err.message ? err.message : err), { durationMs: errDuration }, err);
        throw err;
      });
  }

  function bufferLog(entry) {
    inMemoryBuffer.push(entry);
    if (inMemoryBuffer.length >= FLUSH_BATCH_SIZE) {
      flush();
    }
  }

  function getStoredLogs(callback) {
    var storage = getChromeStorage();
    if (!storage) {
      if (callback) callback(inMemoryBuffer.slice());
      return Promise.resolve(inMemoryBuffer.slice());
    }

    return new Promise(function (resolve) {
      storage.get([LOGS_STORAGE_KEY], function (result) {
        var logs = (result && result[LOGS_STORAGE_KEY]) || [];
        if (callback) callback(logs);
        resolve(logs);
      });
    });
  }

  function clearStoredLogs() {
    inMemoryBuffer = [];
    var storage = getChromeStorage();
    if (storage) {
      return new Promise(function (resolve) {
        var update = {};
        update[LOGS_STORAGE_KEY] = [];
        storage.set(update, resolve);
      });
    }
    return Promise.resolve();
  }

  function flush() {
    if (isFlushing || inMemoryBuffer.length === 0) return Promise.resolve();
    isFlushing = true;
    var batch = inMemoryBuffer.slice();
    inMemoryBuffer = [];

    var storage = getChromeStorage();
    if (!storage) {
      isFlushing = false;
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      storage.get([LOGS_STORAGE_KEY, 'autogifter_gas_webapp_url'], function (res) {
        var existing = (res && res[LOGS_STORAGE_KEY]) || [];
        var combined = existing.concat(batch).slice(-MAX_STORED_LOGS);
        var update = {};
        update[LOGS_STORAGE_KEY] = combined;

        storage.set(update, function () {
          var webappUrl = res && res.autogifter_gas_webapp_url;
          var criticalOrErrors = batch.filter(function (b) { return b.severity === 'ERROR' || b.severity === 'CRITICAL'; });

          // If GAS WebApp is configured and we have errors, flush to GAS
          if (webappUrl && criticalOrErrors.length > 0 && typeof fetch !== 'undefined') {
            try {
              fetch(webappUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'telemetry',
                  logs: criticalOrErrors
                })
              }).catch(function (netErr) {
                console.warn('[Auto-Gifter Telemetry] Remote flush note:', netErr);
              });
            } catch (_) {}
          }

          isFlushing = false;
          resolve();
        });
      });
    });
  }

  function exportDiagnosticsJson() {
    return getStoredLogs().then(function (logs) {
      var dump = {
        exportedAt: new Date().toISOString(),
        environment: {
          userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) || 'unknown',
          url: (typeof window !== 'undefined' && window.location && window.location.href) || 'unknown'
        },
        logCount: logs.length,
        logs: logs
      };
      return JSON.stringify(dump, null, 2);
    });
  }

  // Setup Global Error Listeners in Browser
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function (event) {
      if (event.error && event.error.__autogifterHandled) return;
      captureError('WindowGlobal', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason;
      var err = reason instanceof Error ? reason : new Error(String(reason));
      captureError('UnhandledPromise', err, { rawReason: String(reason) });
    });
  }

  var Telemetry = {
    log: log,
    captureError: captureError,
    measure: measure,
    measureAsync: measureAsync,
    bufferLog: bufferLog,
    flush: flush,
    getStoredLogs: getStoredLogs,
    clearStoredLogs: clearStoredLogs,
    exportDiagnosticsJson: exportDiagnosticsJson,
    LOGS_STORAGE_KEY: LOGS_STORAGE_KEY
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Telemetry;
  }
  global.AutoGifterTelemetry = Telemetry;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
