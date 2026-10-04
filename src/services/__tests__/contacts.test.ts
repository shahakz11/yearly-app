import { matchNameToContact } from '../contactMatcher';
import { ContactProfile } from '../../types';

describe('Contact Matcher', () => {
  const mockContacts: ContactProfile[] = [
    { id: '1', name: 'Maya Cohen', phone: '+15551234', email: 'maya@example.com' },
    { id: '2', name: 'David Smith', phone: '+15555678', email: 'david@example.com' },
    { id: '3', name: 'Mom', phone: '+15559999' },
  ];

  test('matches exact name', () => {
    const match = matchNameToContact('Maya Cohen', mockContacts);
    expect(match?.id).toBe('1');
  });

  test('matches by first name', () => {
    const match = matchNameToContact('Maya', mockContacts);
    expect(match?.id).toBe('1');
  });

  test('matches partial/nickname', () => {
    const match = matchNameToContact('Mom', mockContacts);
    expect(match?.id).toBe('3');
  });

  test('returns null if no reasonable match found', () => {
    const match = matchNameToContact('Jonathan', mockContacts);
    expect(match).toBeNull();
  });
});
