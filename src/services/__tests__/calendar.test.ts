import { classifyEventTitle, calculateDaysUntil } from '../calendarClassifier';

describe('Calendar Event Classifier', () => {
  test('correctly identifies birthdays and extracts names', () => {
    const res1 = classifyEventTitle("Maya's Birthday 🎂");
    expect(res1.eventType).toBe('birthday');
    expect(res1.extractedName).toBe('Maya');
    expect(res1.confidenceScore).toBeGreaterThanOrEqual(0.9);

    const res2 = classifyEventTitle("Dad's 60th Bday");
    expect(res2.eventType).toBe('birthday');
    expect(res2.extractedName).toBe('Dad');

    const res3 = classifyEventTitle("Birthday for Sarah");
    expect(res3.eventType).toBe('birthday');
    expect(res3.extractedName).toBe('Sarah');
  });

  test('correctly identifies anniversaries and extracts names', () => {
    const res = classifyEventTitle("Sarah & David's Wedding Anniversary 💍");
    expect(res.eventType).toBe('anniversary');
    expect(res.extractedName).toBe('Sarah & David');
  });

  test('flags generic events as custom with low confidence', () => {
    const res = classifyEventTitle("Team Sync Meeting");
    expect(res.eventType).toBe('custom');
    expect(res.confidenceScore).toBeLessThan(0.5);
  });

  test('calculates days until upcoming annual event', () => {
    const fixedToday = new Date(2026, 8, 5); // Sep 5, 2026
    // Event is Sep 8, 2026 -> exactly 3 days away
    const days = calculateDaysUntil('2020-09-08', true, fixedToday);
    expect(days).toBe(3);
  });

  test('calculates days until event that rolled over into next year', () => {
    const fixedToday = new Date(2026, 8, 5); // Sep 5, 2026
    // Event was Jan 10 -> will occur Jan 10, 2027
    const days = calculateDaysUntil('1995-01-10', true, fixedToday);
    expect(days).toBeGreaterThan(100);
  });
});
