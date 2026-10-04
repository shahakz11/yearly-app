import * as Notifications from 'expo-notifications';
import { CalendarEventItem } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

export async function scheduleEventNudge(
  event: CalendarEventItem,
  daysBefore: number,
  hourOfDay = 9
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  try {
    const eventDate = new Date(event.eventDate);
    const triggerDate = new Date(eventDate);
    triggerDate.setDate(eventDate.getDate() - daysBefore);
    triggerDate.setHours(hourOfDay, 0, 0, 0);

    if (triggerDate.getTime() <= Date.now()) {
      return null;
    }

    let title = `Upcoming Celebration: ${event.title}`;
    let body = `It's coming up in ${daysBefore} days! Tap to choose a gift card or greeting.`;

    if (daysBefore === 0) {
      title = `🎉 It's ${event.contactName || 'someone'}'s special day!`;
      body = `Don't forget to send your love! Tap to send a treat in 1 click.`;
    } else if (daysBefore === 1) {
      body = `Tomorrow is the big day! Send a treat before it's too late.`;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { eventId: event.id, url: `/event/${event.id}` },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return notificationId;
  } catch (err) {
    console.warn('Error scheduling notification:', err);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('Error cancelling notification:', err);
  }
}
