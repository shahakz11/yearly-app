import {
  CelebrationLogRow,
  GasCatalogResponse,
  GasEventsResponse,
  GasLogGiftPayload,
  GasLogGiftResponse,
  GasPingResponse,
  UpcomingCelebration,
} from './types';
import {
  buildGiftUrl,
  buildWhatsAppShareUrl,
  DEFAULT_CATALOG,
  generateGreeting,
} from './contractOracle';
import { CalendarEventScenario, POSITIVE_SCENARIOS } from '../fixtures/calendarScenarios';

/**
 * In-Memory Google Sheet CelebrationLog simulator
 * 9-Column schema matching PROJECT.md § Interface Contracts #3
 */
export class CelebrationLogSheet {
  private rows: CelebrationLogRow[] = [];

  constructor(initialRows: CelebrationLogRow[] = []) {
    this.rows = [...initialRows];
  }

  public getHeaders(): string[] {
    return [
      'Date',
      'Recipient Name',
      'Event Type',
      'Gift Sent',
      'Greeting Used',
      'Brand Chosen',
      'Amount',
      'Event ID',
      'Last Updated',
    ];
  }

  public getRows(): CelebrationLogRow[] {
    return [...this.rows];
  }

  public getRowCount(): number {
    return this.rows.length;
  }

  /**
   * Append or update celebration with deduplication by eventId (or date_recipient fallback)
   */
  public logCelebration(entry: {
    date: string;
    recipientName: string;
    eventType: 'birthday' | 'anniversary' | 'milestone';
    giftSent?: boolean;
    greetingUsed?: string;
    brandChosen?: string;
    amount?: number;
    eventId: string;
  }): { row: number; isUpdate: boolean } {
    const existingIndex = this.rows.findIndex(
      (r) => r.eventId === entry.eventId || `${r.date}_${r.recipientName}` === `${entry.date}_${entry.recipientName}`
    );

    const now = new Date().toISOString();
    const updatedRow: CelebrationLogRow = {
      date: entry.date,
      recipientName: entry.recipientName,
      eventType: entry.eventType,
      giftSent: entry.giftSent ?? false,
      greetingUsed: entry.greetingUsed || '',
      brandChosen: entry.brandChosen || '',
      amount: entry.amount || 0,
      eventId: entry.eventId,
      lastUpdated: now,
    };

    if (existingIndex >= 0) {
      // Preserve existing giftSent=true if already set
      if (this.rows[existingIndex].giftSent && !entry.giftSent) {
        updatedRow.giftSent = true;
        updatedRow.brandChosen = this.rows[existingIndex].brandChosen;
        updatedRow.amount = this.rows[existingIndex].amount;
      }
      this.rows[existingIndex] = updatedRow;
      return { row: existingIndex + 2, isUpdate: true }; // +2 for 1-indexed header offset
    } else {
      this.rows.push(updatedRow);
      return { row: this.rows.length + 1, isUpdate: false };
    }
  }

  /**
   * Mark gift sent for an existing or new event
   */
  public markGiftSent(payload: GasLogGiftPayload): { row: number; success: boolean } {
    const existingIndex = this.rows.findIndex((r) => r.eventId === payload.eventId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      this.rows[existingIndex].giftSent = true;
      this.rows[existingIndex].brandChosen = payload.brandChosen;
      this.rows[existingIndex].amount = payload.amount;
      if (payload.greetingUsed) {
        this.rows[existingIndex].greetingUsed = payload.greetingUsed;
      }
      this.rows[existingIndex].lastUpdated = now;
      return { row: existingIndex + 2, success: true };
    } else {
      const newRow: CelebrationLogRow = {
        date: payload.date || now.split('T')[0],
        recipientName: payload.recipientName,
        eventType: 'birthday',
        giftSent: true,
        greetingUsed: payload.greetingUsed || '',
        brandChosen: payload.brandChosen,
        amount: payload.amount,
        eventId: payload.eventId,
        lastUpdated: now,
      };
      this.rows.push(newRow);
      return { row: this.rows.length + 1, success: true };
    }
  }

  public findByEventId(eventId: string): CelebrationLogRow | undefined {
    return this.rows.find((r) => r.eventId === eventId);
  }

  public reset(): void {
    this.rows = [];
  }
}

/**
 * Headless Google Apps Script WebApp simulator (doGet / doPost)
 */
export class GasWebAppSimulator {
  public sheet: CelebrationLogSheet;
  private calendarEvents: CalendarEventScenario[];

  constructor(calendarEvents: CalendarEventScenario[] = POSITIVE_SCENARIOS) {
    this.sheet = new CelebrationLogSheet();
    this.calendarEvents = [...calendarEvents];
  }

  /**
   * Handles GET requests
   */
  public handleDoGet(params: Record<string, string>): {
    status: number;
    body: GasPingResponse | GasCatalogResponse | GasEventsResponse | { status: 'error'; message: string };
  } {
    const action = params.action;

    if (action === 'ping') {
      return {
        status: 200,
        body: {
          status: 'ok',
          service: 'Auto-Gifter GAS Backend',
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (action === 'catalog') {
      return {
        status: 200,
        body: {
          status: 'ok',
          catalog: DEFAULT_CATALOG,
        },
      };
    }

    if (action === 'events') {
      const days = parseInt(params.days || '14', 10);
      const upcoming = this.getUpcomingCelebrations(days);
      return {
        status: 200,
        body: {
          status: 'ok',
          events: upcoming,
        },
      };
    }

    return {
      status: 400,
      body: {
        status: 'error',
        message: `Unknown or missing action: ${action}`,
      },
    };
  }

  /**
   * Handles POST requests
   */
  public handleDoPost(payload: Partial<GasLogGiftPayload>): {
    status: number;
    body: GasLogGiftResponse | { status: 'error'; message: string };
  } {
    if (!payload || payload.action !== 'log_gift') {
      return {
        status: 400,
        body: {
          status: 'error',
          message: 'Invalid POST action. Expected action="log_gift"',
        },
      };
    }

    if (!payload.eventId || !payload.recipientName || !payload.brandChosen || !payload.amount) {
      return {
        status: 400,
        body: {
          status: 'error',
          message: 'Missing required fields: eventId, recipientName, brandChosen, amount',
        },
      };
    }

    const result = this.sheet.markGiftSent(payload as GasLogGiftPayload);
    return {
      status: 200,
      body: {
        status: 'ok',
        logged: result.success,
        row: result.row,
      },
    };
  }

  /**
   * Simulates Daily Trigger scanning next 14 days and synchronizing with Google Sheet
   */
  public runDailyTrigger(daysAhead = 14): { scannedCount: number; loggedRows: number } {
    const celebrations = this.getUpcomingCelebrations(daysAhead);
    let loggedCount = 0;

    for (const celeb of celebrations) {
      const res = this.sheet.logCelebration({
        date: celeb.date,
        recipientName: celeb.recipientName || 'Friend',
        eventType: celeb.celebrationType,
        greetingUsed: celeb.suggestedGreeting,
        eventId: celeb.id,
      });
      if (!res.isUpdate) {
        loggedCount++;
      }
    }

    return {
      scannedCount: celebrations.length,
      loggedRows: loggedCount,
    };
  }

  private getUpcomingCelebrations(daysAhead: number): UpcomingCelebration[] {
    return this.calendarEvents
      .filter((e) => e.expected.isCelebration)
      .slice(0, daysAhead)
      .map((e) => {
        const type = e.expected.celebrationType || 'birthday';
        const name = e.expected.recipientName || 'Friend';
        const greeting = generateGreeting({
          recipientName: name,
          celebrationType: type,
          tone: 'warm',
        });
        const giftUrl = buildGiftUrl('starbucks', 25, `cal_${name}`);
        const whatsAppUrl = buildWhatsAppShareUrl({
          greeting,
          giftLink: giftUrl,
        });

        return {
          id: e.id,
          title: e.title,
          date: e.startDate.split('T')[0],
          celebrationType: type,
          recipientName: e.expected.recipientName ?? null,
          suggestedGreeting: greeting,
          whatsAppUrl,
        };
      });
  }
}
