import * as SQLite from 'expo-sqlite';
import { GiftRecord, UserPreferences } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('autogifter.db');
    await initializeTables(db);
  }
  return db;
}

async function initializeTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS gifts_history (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL,
      contact_id TEXT,
      recipient_name TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      amount REAL NOT NULL,
      greeting_sent TEXT NOT NULL,
      delivered_via TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

/**
 * Records a completed gift in local history.
 */
export async function recordGiftSent(record: GiftRecord): Promise<void> {
  try {
    const database = await getDb();
    await database.runAsync(
      `INSERT INTO gifts_history (id, event_id, contact_id, recipient_name, brand_id, brand_name, amount, greeting_sent, delivered_via, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.eventId,
      record.contactId || null,
      record.recipientName,
      record.brandId,
      record.brandName,
      record.amount,
      record.greetingSent,
      record.deliveredVia,
      record.createdAt
    );
  } catch (err) {
    console.error('Failed to save gift history:', err);
  }
}

/**
 * Retrieves past gifts sent.
 */
export async function getGiftsHistory(): Promise<GiftRecord[]> {
  try {
    const database = await getDb();
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM gifts_history ORDER BY created_at DESC'
    );

    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      contactId: r.contact_id,
      recipientName: r.recipient_name,
      brandId: r.brand_id,
      brandName: r.brand_name,
      amount: r.amount,
      greetingSent: r.greeting_sent,
      deliveredVia: r.delivered_via,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn('Failed to read gift history:', err);
    return [];
  }
}

/**
 * Saves user settings.
 */
export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    const database = await getDb();
    await database.runAsync(
      'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
      'user_prefs',
      JSON.stringify(prefs)
    );
  } catch (err) {
    console.error('Failed to save preferences:', err);
  }
}

/**
 * Retrieves user settings.
 */
export async function getPreferences(): Promise<UserPreferences> {
  const defaultPrefs: UserPreferences = {
    notificationDaysBefore: [7, 3, 0],
    notificationHour: 9,
    autoMatchContacts: true,
    selectedCalendarIds: [],
  };

  try {
    const database = await getDb();
    const row = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM preferences WHERE key = ?',
      'user_prefs'
    );

    if (row && row.value) {
      return JSON.parse(row.value);
    }
  } catch (err) {
    console.warn('Failed to load preferences:', err);
  }

  return defaultPrefs;
}
