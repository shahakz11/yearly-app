import { ContactProfile } from '../types';

/**
 * Fuzzy matches an event name against a list of contacts in memory.
 */
export function matchNameToContact(
  targetName: string,
  contacts: ContactProfile[]
): ContactProfile | null {
  if (!targetName || contacts.length === 0) return null;

  const cleanTarget = targetName.toLowerCase().trim();

  // 1. Exact match
  const exact = contacts.find((c) => c.name.toLowerCase().trim() === cleanTarget);
  if (exact) return exact;

  // 2. Starts with / First name match
  const firstMatch = contacts.find((c) => {
    const contactFirst = c.name.toLowerCase().split(' ')[0];
    const targetFirst = cleanTarget.split(' ')[0];
    return contactFirst === targetFirst && contactFirst.length > 1;
  });
  if (firstMatch) return firstMatch;

  // 3. Substring inclusion
  const partial = contacts.find(
    (c) => c.name.toLowerCase().includes(cleanTarget) || cleanTarget.includes(c.name.toLowerCase())
  );
  return partial || null;
}
