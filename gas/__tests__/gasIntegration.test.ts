import {
  setupGasGlobals,
  resetGasGlobals,
  MockCalendarApp,
  MockSpreadsheetApp,
  MockPropertiesService,
  MockScriptApp,
  MockCalendarEvent
} from './mocks/GasMocks';

// Setup GAS globals before requiring GAS source modules
setupGasGlobals();

const AutoGifterCore = require('../CoreEngine');
const AddOn = require('../AddOn');
const SheetsLogger = require('../SheetsLogger');
const WebApp = require('../WebApp');

describe('Milestone 2: Google Workspace Add-on (GAS) & Sheets Persistence', () => {
  beforeEach(() => {
    resetGasGlobals();
    // Ensure AutoGifterCore is available globally as in GAS runtime
    (global as any).AutoGifterCore = AutoGifterCore;
  });

  // =========================================================================
  // 1. Manifest & Bundle Sanity
  // =========================================================================
  describe('1. Manifest & Universal Engine Bundle', () => {
    it('appsscript.json has valid Calendar Add-on configuration and scopes', () => {
      const manifest = require('../appsscript.json');
      expect(manifest.runtimeVersion).toBe('V8');
      expect(manifest.addOns).toBeDefined();
      expect(manifest.addOns.calendar).toBeDefined();
      expect(manifest.addOns.calendar.currentEventAccess).toBe('READ_WRITE');
      expect(manifest.addOns.calendar.eventOpenTrigger.runFunction).toBe('onCalendarEventOpen');

      const expectedScopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/script.external_request',
        'https://www.googleapis.com/auth/calendar.addons.execute',
        'https://www.googleapis.com/auth/calendar.addons.current.event.read',
        'https://www.googleapis.com/auth/calendar.addons.current.event.write'
      ];
      expectedScopes.forEach(scope => {
        expect(manifest.oauthScopes).toContain(scope);
      });
    });

    it('gas/CoreEngine.js exposes universal core engine API', () => {
      expect(AutoGifterCore).toBeDefined();
      expect(typeof AutoGifterCore.classifyEvent).toBe('function');
      expect(typeof AutoGifterCore.getCatalog).toBe('function');
      expect(typeof AutoGifterCore.generateGreeting).toBe('function');
      expect(typeof AutoGifterCore.buildGiftUrl).toBe('function');
      expect(typeof AutoGifterCore.buildWhatsAppShareUrl).toBe('function');
    });
  });

  // =========================================================================
  // 2. CardService Sidebar Card Builder (Requirement R2)
  // =========================================================================
  describe('2. CardService Sidebar Card Builder (AddOn.js)', () => {
    it('renders celebration card with status, brand chips, greeting TextInput, and WhatsApp link for birthday', () => {
      const now = new Date('2026-10-01T10:00:00Z');
      const endTime = new Date('2026-10-01T11:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();
      const event = new MockCalendarEvent('evt_sarah_bday', "Sarah's Birthday 🎂", now, endTime, 'Remember to celebrate!');
      cal.addEvent(event);

      const triggerEvent = {
        calendar: {
          calendarId: 'primary',
          id: 'evt_sarah_bday'
        }
      };

      const card = AddOn.onCalendarEventOpen(triggerEvent);
      expect(card).toBeDefined();
      expect(card.type).toBe('Card');
      expect(card.header.title).toContain('Auto-Gifter');
      expect(card.header.subtitle).toContain("Sarah's Celebration");

      // Verify automatic calendar enrichment
      expect(event.getDescription()).toContain('FloristOne Flower Delivery');
      expect(event.getDescription()).toContain('affiliateid=2026097209');
      expect(event.getPopupReminders()).toEqual([9420, 3660]);

      // Verify sections
      expect(card.sections.length).toBeGreaterThanOrEqual(2);

      // Section 1: FloristOne Bestsellers (1-Click Order Buttons & Images)
      const floristSection = card.sections.find((s: any) => s.header && s.header.includes('FloristOne'));
      expect(floristSection).toBeDefined();
      const floristButtons = floristSection.widgets.filter((w: any) => w.type === 'ButtonSet');
      expect(floristButtons.length).toBeGreaterThanOrEqual(1);
      const firstFloristBtn = floristButtons[0].buttons[0];
      expect(firstFloristBtn.openLink.url).toContain('floristone.com/cart.cfm');
      expect(firstFloristBtn.openLink.url).toContain('affiliateid=2026097209');
    });

    it('renders celebration card for anniversary event', () => {
      const now = new Date('2026-10-05T12:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();
      const event = new MockCalendarEvent('evt_anniv', 'Wedding Anniversary 💍', now, now);
      cal.addEvent(event);

      const card = AddOn.onCalendarEventOpen({ calendar: { id: 'evt_anniv' } });
      expect(card.type).toBe('Card');
      const floristSection = card.sections.find((s: any) => s.header && s.header.includes('FloristOne'));
      expect(floristSection).toBeDefined();
    });

    it('renders clean non-intrusive card when opened event is not a celebration', () => {
      const now = new Date('2026-10-02T09:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();
      const event = new MockCalendarEvent('evt_standup', 'Team Standup', now, now);
      cal.addEvent(event);

      const card = AddOn.onCalendarEventOpen({ calendar: { id: 'evt_standup' } });
      expect(card.type).toBe('Card');
      expect(card.header.subtitle).toBe('No Celebration Detected');

      // No gift sections rendered
      const giftSection = card.sections.find((s: any) => s.header === 'Gift Card Options');
      expect(giftSection).toBeUndefined();
    });

    it('renders clean fallback card when event id is missing or not found', () => {
      const card = AddOn.onCalendarEventOpen(null);
      expect(card.type).toBe('Card');
      expect(card.sections[0].widgets[0].text).toBe('Notice');

      const card2 = AddOn.onCalendarEventOpen({ calendar: { id: 'non_existent' } });
      expect(card2.type).toBe('Card');
      expect(card2.sections[0].widgets[0].bottomLabel).toContain('not be found');
    });

    it('renders homepage card on onCalendarHomepage', () => {
      const card = AddOn.onCalendarHomepage({});
      expect(card.type).toBe('Card');
      expect(card.header.title).toContain('Auto-Gifter');
      expect(card.sections[0].header).toBe('Ready to Celebrate');
    });

    it('handles onSyncAllCelebrations and returns sync summary card', () => {
      const cal = MockCalendarApp.getDefaultCalendar();
      const bday = new Date('2026-10-12T10:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_sync_test', "Daniel's Birthday 🎂", bday, bday));

      const card = AddOn.onSyncAllCelebrations({});
      expect(card.type).toBe('Card');
      expect(card.header.subtitle).toBe('Calendar Sync Complete');
      expect(card.sections[0].widgets[0].text).toContain('Celebrations Enriched');
    });

    it('handles action callbacks onRegenerateGreeting and onManualMarkSent', () => {
      const regResp = AddOn.onRegenerateGreeting({
        parameters: { recipientName: 'Sarah', celebrationType: 'birthday' }
      });
      expect(regResp.type).toBe('ActionResponse');
      expect(regResp.notification.text).toContain('greeting');

      const markResp = AddOn.onManualMarkSent({
        parameters: { eventId: 'evt_sarah_1', recipientName: 'Sarah', celebrationType: 'birthday' }
      });
      expect(markResp.type).toBe('ActionResponse');
      expect(markResp.notification.text).toContain('CelebrationLog');
    });
  });

  // =========================================================================
  // 3. Google Sheets Persistence & Daily Scanner (Requirements R2 & R4)
  // =========================================================================
  describe('3. Google Sheets Persistence & Daily Scanner (SheetsLogger.js)', () => {
    it('auto-provisions CelebrationLog sheet with 9 standard columns', () => {
      const sheet = SheetsLogger.getOrCreateCelebrationSheet();
      expect(sheet).toBeDefined();
      expect(sheet.getName()).toBe('CelebrationLog');
      expect(sheet.getLastRow()).toBe(1);

      const headerValues = sheet.getRange(1, 1, 1, 9).getValues()[0];
      expect(headerValues).toEqual([
        'Date',
        'Recipient Name',
        'Event Type',
        'Gift Sent',
        'Greeting Used',
        'Brand Chosen',
        'Amount',
        'Event ID',
        'Last Updated'
      ]);

      // Re-invoking reuses the existing spreadsheet and sheet
      const userProps = MockPropertiesService.getUserProperties();
      const savedId = userProps.getProperty('AUTOGIFTER_SPREADSHEET_ID');
      expect(savedId).toBeTruthy();

      const sheetAgain = SheetsLogger.getOrCreateCelebrationSheet();
      expect(sheetAgain.getLastRow()).toBe(1);
    });

    it('scans next 14 days, logs upcoming celebrations, and deduplicates across scans', () => {
      const baseDate = new Date('2026-10-01T08:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();

      // Day +2: Sarah's Birthday (within 14 days)
      const dateSarah = new Date('2026-10-03T10:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_sarah_bday', "Sarah's Birthday 🎂", dateSarah, dateSarah));

      // Day +6: Maya & Dave's Anniversary (within 14 days)
      const dateMaya = new Date('2026-10-07T14:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_maya_anniv', "Maya & Dave's Anniversary 💍", dateMaya, dateMaya));

      // Day +4: Doctor Appointment (non-celebration, should be skipped)
      const dateDoc = new Date('2026-10-05T09:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_doctor', 'Doctor Appointment', dateDoc, dateDoc));

      // Day +20: Mom's Birthday (outside 14-day window, should be skipped)
      const dateMom = new Date('2026-10-21T10:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_mom_future', "Mom's Birthday 🎂", dateMom, dateMom));

      // First Scan
      const scanResult1 = SheetsLogger.dailyCelebrationScan(baseDate);
      expect(scanResult1.scannedEvents).toBe(3); // 3 events inside 14-day window
      expect(scanResult1.newCelebrationsLogged).toBe(2);
      expect(scanResult1.existingCelebrationsRetained).toBe(0);

      const sheet = SheetsLogger.getOrCreateCelebrationSheet();
      expect(sheet.getLastRow()).toBe(3); // 1 header + 2 celebrations

      const rows = sheet.getDataRange().getValues();
      // Row 1: Sarah
      expect(rows[1][0]).toBe('2026-10-03');
      expect(rows[1][1]).toBe('Sarah');
      expect(rows[1][2]).toBe('birthday');
      expect(rows[1][3]).toBe(false); // Gift Sent = false
      expect(rows[1][4]).toContain('Sarah');
      expect(rows[1][7]).toBe('evt_sarah_bday');

      // Row 2: Maya & Dave
      expect(rows[2][0]).toBe('2026-10-07');
      expect(rows[2][1]).toBe('Maya & Dave');
      expect(rows[2][2]).toBe('anniversary');
      expect(rows[2][3]).toBe(false);
      expect(rows[2][7]).toBe('evt_maya_anniv');

      // Second Scan (Deduplication Check)
      const scanResult2 = SheetsLogger.dailyCelebrationScan(baseDate);
      expect(scanResult2.newCelebrationsLogged).toBe(0);
      expect(scanResult2.existingCelebrationsRetained).toBe(2);
      expect(sheet.getLastRow()).toBe(3); // NO duplicate rows added
    });

    it('logGiftSent updates existing row with Gift Sent = TRUE, brand, and amount', () => {
      const baseDate = new Date('2026-10-01T08:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();
      const dateSarah = new Date('2026-10-03T10:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_sarah_bday', "Sarah's Birthday 🎂", dateSarah, dateSarah));

      SheetsLogger.dailyCelebrationScan(baseDate);

      // Log gift send for Sarah
      const logRes = SheetsLogger.logGiftSent({
        eventId: 'evt_sarah_bday',
        brandChosen: 'Starbucks',
        amount: 25,
        recipientName: 'Sarah',
        greetingUsed: 'Enjoy your coffee, Sarah!'
      });

      expect(logRes.success).toBe(true);
      expect(logRes.action).toBe('updated');
      expect(logRes.row).toBe(2);

      const sheet = SheetsLogger.getOrCreateCelebrationSheet();
      const updatedRow = sheet.getRange(2, 1, 1, 9).getValues()[0];
      expect(updatedRow[3]).toBe(true); // Col D: Gift Sent = true
      expect(updatedRow[4]).toBe('Enjoy your coffee, Sarah!'); // Col E: Greeting Used
      expect(updatedRow[5]).toBe('Starbucks'); // Col F: Brand Chosen
      expect(updatedRow[6]).toBe(25); // Col G: Amount
      expect(updatedRow[8]).toBeTruthy(); // Col I: Last Updated

      // Running dailyCelebrationScan again preserves Gift Sent = true
      SheetsLogger.dailyCelebrationScan(baseDate);
      const rowAfterScan = sheet.getRange(2, 1, 1, 9).getValues()[0];
      expect(rowAfterScan[3]).toBe(true);
      expect(rowAfterScan[5]).toBe('Starbucks');
    });

    it('logGiftSent appends new row when eventId was not pre-logged', () => {
      const logRes = SheetsLogger.logGiftSent(
        'evt_unlogged_123',
        'DoorDash',
        50,
        'Alex',
        '2026-10-10',
        'Have a great meal Alex!'
      );

      expect(logRes.success).toBe(true);
      expect(logRes.action).toBe('inserted');

      const sheet = SheetsLogger.getOrCreateCelebrationSheet();
      const alexRow = sheet.getRange(logRes.row, 1, 1, 9).getValues()[0];
      expect(alexRow[1]).toBe('Alex');
      expect(alexRow[3]).toBe(true);
      expect(alexRow[5]).toBe('DoorDash');
      expect(alexRow[6]).toBe(50);
      expect(alexRow[7]).toBe('evt_unlogged_123');
    });

    it('getCelebrationHistory returns formatted objects from sheet', () => {
      SheetsLogger.logGiftSent({
        eventId: 'evt_hist_1',
        brandChosen: 'Amazon',
        amount: 100,
        recipientName: 'Taylor',
        date: '2026-10-15',
        greetingUsed: 'Happy Birthday Taylor!'
      });

      const history = SheetsLogger.getCelebrationHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
      const entry = history.find((h: any) => h.eventId === 'evt_hist_1');
      expect(entry).toBeDefined();
      expect(entry.recipientName).toBe('Taylor');
      expect(entry.brandChosen).toBe('Amazon');
      expect(entry.amount).toBe(100);
      expect(entry.giftSent).toBe(true);
    });

    it('installDailyTrigger installs daily 8am trigger and prevents duplicate triggers', () => {
      SheetsLogger.installDailyTrigger();
      let triggers = MockScriptApp.getProjectTriggers();
      expect(triggers.length).toBe(1);
      expect(triggers[0].getHandlerFunction()).toBe('dailyCelebrationScan');

      // Calling again replaces existing trigger
      SheetsLogger.installDailyTrigger();
      triggers = MockScriptApp.getProjectTriggers();
      expect(triggers.length).toBe(1);
    });
  });

  // =========================================================================
  // 4. Headless Web App JSON API (Requirement R2)
  // =========================================================================
  describe('4. Headless Web App JSON API (WebApp.js)', () => {
    it('doGet(?action=ping) returns service status', () => {
      const resp = WebApp.doGet({ parameter: { action: 'ping' } });
      expect(resp.getMimeType()).toBe('application/json');
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(data.service).toBe('Auto-Gifter GAS Backend');
      expect(data.version).toBe('1.0.0');
      expect(data.timestamp).toBeDefined();
    });

    it('doGet(?action=catalog) returns 4 affiliate gift brands with chips', () => {
      const resp = WebApp.doGet({ parameter: { action: 'catalog' } });
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(Array.isArray(data.catalog)).toBe(true);
      expect(data.catalog.length).toBeGreaterThanOrEqual(4);

      const brandIds = data.catalog.map((b: any) => b.id);
      expect(brandIds).toContain('starbucks');
      expect(brandIds).toContain('doordash');
      expect(brandIds).toContain('amazon');
      expect(brandIds).toContain('target');

      data.catalog.forEach((brand: any) => {
        expect(brand.supportedAmounts).toEqual([15, 25, 50, 100]);
        expect(brand.affiliateUrlTemplate).toContain('{affiliateId}');
      });
    });

    it('doGet(?action=events&days=14) scans calendar and returns upcoming celebrations', () => {
      const now = new Date('2026-10-01T08:00:00Z');
      const cal = MockCalendarApp.getDefaultCalendar();
      const bday = new Date('2026-10-04T10:00:00Z');
      cal.addEvent(new MockCalendarEvent('evt_claire', "Claire's Birthday 🎂", bday, bday));

      const resp = WebApp.doGet({ parameter: { action: 'events', days: '14' } });
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(data.days).toBe(14);
      expect(data.count).toBeGreaterThanOrEqual(1);

      const event = data.events.find((e: any) => e.recipientName === 'Claire');
      expect(event).toBeDefined();
      expect(event.celebrationType).toBe('birthday');
      expect(event.suggestedGreeting).toContain('Claire');
      expect(event.bestsellers.length).toBeGreaterThanOrEqual(1);
      expect(event.bestsellers[0].cartUrl).toContain('floristone.com/cart.cfm');
    });

    it('doGet(?action=sync_all&days=90) batch enriches all upcoming celebrations', () => {
      const cal = MockCalendarApp.getDefaultCalendar();
      const futureDate = new Date(Date.now() + 5 * 86400000);
      cal.addEvent(new MockCalendarEvent('evt_sync_web', "Emma's Birthday 🎂", futureDate, futureDate));

      const resp = WebApp.doGet({ parameter: { action: 'sync_all', days: '90' } });
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(data.sync).toBeDefined();
      expect(data.sync.scanned).toBeGreaterThanOrEqual(1);
      expect(data.sync.enriched).toBeGreaterThanOrEqual(1);
    });

    it('doGet(?action=log_gift) updates CelebrationLog sheet and returns status', () => {
      const resp = WebApp.doGet({
        parameter: {
          action: 'log_gift',
          eventId: 'evt_web_1',
          recipient: 'Oliver',
          brand: 'Target',
          amount: '50',
          date: '2026-10-08',
          greeting: 'Happy Birthday Oliver!'
        }
      });

      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(data.logged).toBe(true);
      expect(data.result.success).toBe(true);

      const history = SheetsLogger.getCelebrationHistory();
      const entry = history.find((h: any) => h.eventId === 'evt_web_1');
      expect(entry).toBeDefined();
      expect(entry.recipientName).toBe('Oliver');
      expect(entry.brandChosen).toBe('Target');
      expect(entry.amount).toBe(50);
    });

    it('doPost handles JSON body for action=log_gift', () => {
      const postPayload = {
        action: 'log_gift',
        eventId: 'evt_post_2',
        recipientName: 'Sophia',
        brandChosen: 'DoorDash',
        amount: 25,
        date: '2026-10-12',
        greetingUsed: 'Enjoy dinner Sophia!'
      };

      const resp = WebApp.doPost({
        postData: {
          contents: JSON.stringify(postPayload)
        }
      });

      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(data.logged).toBe(true);

      const history = SheetsLogger.getCelebrationHistory();
      const entry = history.find((h: any) => h.eventId === 'evt_post_2');
      expect(entry).toBeDefined();
      expect(entry.recipientName).toBe('Sophia');
      expect(entry.brandChosen).toBe('DoorDash');
      expect(entry.amount).toBe(25);
    });

    it('doGet(?action=history) returns audit log history', () => {
      const resp = WebApp.doGet({ parameter: { action: 'history' } });
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('ok');
      expect(Array.isArray(data.history)).toBe(true);
    });

    it('returns error for unknown actions', () => {
      const resp = WebApp.doGet({ parameter: { action: 'invalid_action' } });
      const data = JSON.parse(resp.getContent());
      expect(data.status).toBe('error');
      expect(data.error).toContain('Unknown action');
    });
  });
});
