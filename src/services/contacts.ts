import * as Contacts from 'expo-contacts';
import { ContactProfile } from '../types';
export { matchNameToContact } from './contactMatcher';

/**
 * Requests native address book permissions on iOS / Android.
 */
export async function requestContactsPermissions(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Could not request contacts permissions:', error);
    return false;
  }
}

/**
 * Searches contacts and matches by name.
 */
export async function findMatchingContact(searchName: string): Promise<ContactProfile | null> {
  if (!searchName || !searchName.trim()) return null;

  try {
    const hasPermission = await requestContactsPermissions();
    if (!hasPermission) return null;

    const { data } = await Contacts.getContactsAsync({
      name: searchName.trim(),
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
        Contacts.Fields.Relationships,
      ],
    });

    if (data && data.length > 0) {
      const match = data[0];
      return {
        id: match.id || Math.random().toString(36).substring(7),
        name: match.name || searchName,
        phone: match.phoneNumbers && match.phoneNumbers.length > 0 ? match.phoneNumbers[0].number : undefined,
        email: match.emails && match.emails.length > 0 ? match.emails[0].email : undefined,
        avatarUri: match.image ? match.image.uri : undefined,
      };
    }
  } catch (err) {
    console.warn('Error matching contact:', err);
  }

  return null;
}
