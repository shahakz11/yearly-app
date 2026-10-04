import * as Calendar from 'expo-calendar';
import { CalendarEventItem } from '../types';
import { classifyEventTitle, calculateDaysUntil } from './calendarClassifier';

export interface CalendarSyncResult {
  events: CalendarEventItem[];
  permissionGranted: boolean;
  error?: string;
}

export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Could not request calendar permissions:', error);
    return false;
  }
}

export async function scanCalendarEvents(daysAhead = 90): Promise<CalendarSyncResult> {
  const hasPermission = await requestCalendarPermissions();

  if (!hasPermission) {
    return {
      events: getSampleEvents(),
      permissionGranted: false,
      error: 'Calendar permission not granted'
    };
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map((c) => c.id);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysAhead);

    const rawEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
    const classifiedEvents: CalendarEventItem[] = [];

    for (const raw of rawEvents) {
      const classification = classifyEventTitle(raw.title);

      if (classification.eventType !== 'custom' || classification.confidenceScore >= 0.7) {
        const days = calculateDaysUntil(raw.startDate);

        classifiedEvents.push({
          id: raw.id,
          sourceCalendarId: raw.calendarId,
          title: raw.title,
          eventType: classification.eventType,
          contactName: classification.extractedName || raw.title,
          eventDate: new Date(raw.startDate).toISOString().split('T')[0],
          daysUntil: days,
          recurrence: raw.recurrenceRule ? 'annual' : 'once',
          confidenceScore: classification.confidenceScore,
          notes: raw.notes || undefined
        });
      }
    }

    classifiedEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      events: classifiedEvents.length > 0 ? classifiedEvents : getSampleEvents(),
      permissionGranted: true
    };
  } catch (err: any) {
    console.error('Error scanning calendars:', err);
    return {
      events: getSampleEvents(),
      permissionGranted: true,
      error: err.message
    };
  }
}

export function getSampleEvents(): CalendarEventItem[] {
  const today = new Date();

  const makeDateStr = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'sample-1',
      title: "Maya's Birthday 🎂",
      contactName: 'Maya Cohen',
      contactPhone: '+1 (555) 234-5678',
      contactEmail: 'maya.cohen@example.com',
      eventType: 'birthday',
      eventDate: makeDateStr(3),
      daysUntil: 3,
      recurrence: 'annual',
      confidenceScore: 0.98,
      notes: 'Loves DoorDash sushi and Starbucks iced lattes!'
    },
    {
      id: 'sample-2',
      title: "Mom's Birthday 🎉",
      contactName: 'Mom',
      contactPhone: '+1 (555) 987-6543',
      eventType: 'birthday',
      eventDate: makeDateStr(7),
      daysUntil: 7,
      recurrence: 'annual',
      confidenceScore: 0.95,
      notes: 'Favorite store is Target & loves Sephora skincare'
    },
    {
      id: 'sample-3',
      title: "Sarah & David's Wedding Anniversary 💍",
      contactName: 'Sarah & David',
      eventType: 'anniversary',
      eventDate: makeDateStr(14),
      daysUntil: 14,
      recurrence: 'annual',
      confidenceScore: 0.92,
      notes: 'Celebration dinner'
    },
    {
      id: 'sample-4',
      title: "Alex's Birthday 🎈",
      contactName: 'Alex Miller',
      contactEmail: 'alex.m@example.com',
      eventType: 'birthday',
      eventDate: makeDateStr(28),
      daysUntil: 28,
      recurrence: 'annual',
      confidenceScore: 0.96
    }
  ];
}
