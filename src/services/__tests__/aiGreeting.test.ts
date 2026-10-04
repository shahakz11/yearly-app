import { generateGreeting, formatShareableMessage } from '../aiGreeting';

describe('AI Greeting Generator', () => {
  test('replaces recipient name accurately', () => {
    const greeting = generateGreeting({
      recipientName: 'Maya',
      eventType: 'birthday',
      tone: 'warm'
    });
    expect(greeting).toContain('Maya');
    expect(greeting.length).toBeGreaterThan(15);
  });

  test('generates funny greeting for anniversary', () => {
    const greeting = generateGreeting({
      recipientName: 'David & Sarah',
      eventType: 'anniversary',
      tone: 'funny'
    });
    expect(greeting).toContain('David & Sarah');
  });

  test('formats shareable message with link for chat apps', () => {
    const formatted = formatShareableMessage('Happy Birthday Maya!', 'https://autogifter.app/gift/123');
    expect(formatted).toContain('Happy Birthday Maya!');
    expect(formatted).toContain('https://autogifter.app/gift/123');
  });
});
