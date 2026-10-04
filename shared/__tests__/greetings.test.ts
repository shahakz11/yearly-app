import { generateGreeting } from '../greetings';

describe('Greetings Service (shared/greetings.ts)', () => {
  describe('Name Substitution & Fallback', () => {
    it('should include recipient name when provided', () => {
      const greeting = generateGreeting({
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        relationshipType: 'friend',
        tone: 'warm',
      });

      expect(greeting).toContain('Sarah');
      expect(greeting).toContain('Happy Birthday');
      expect(greeting).toContain('🎂');
    });

    it('should generate a grammatically clean greeting when recipient name is omitted', () => {
      const greeting = generateGreeting({
        recipientName: null,
        celebrationType: 'birthday',
        relationshipType: 'friend',
        tone: 'warm',
      });

      expect(greeting).toContain('Happy Birthday!');
      expect(greeting).not.toContain('null');
      expect(greeting).not.toContain('undefined');
      expect(greeting).not.toContain('Happy Birthday, !');
    });
  });

  describe('Celebration & Relationship Combinations', () => {
    it('should format partner birthday with loving tone', () => {
      const greeting = generateGreeting({
        recipientName: 'Alex',
        celebrationType: 'birthday',
        relationshipType: 'partner',
        tone: 'warm',
      });

      expect(greeting).toContain('Alex');
      expect(greeting).toContain('favorite person');
    });

    it('should format colleague birthday professionally', () => {
      const greeting = generateGreeting({
        recipientName: 'Jordan',
        celebrationType: 'birthday',
        relationshipType: 'colleague',
        tone: 'formal',
      });

      expect(greeting).toContain('Jordan');
      expect(greeting).toContain('continued success');
    });

    it('should format anniversary for friends', () => {
      const greeting = generateGreeting({
        recipientName: 'David & Lisa',
        celebrationType: 'anniversary',
        relationshipType: 'friend',
        tone: 'fun',
      });

      expect(greeting).toContain('David & Lisa');
      expect(greeting).toContain('Happy Anniversary');
    });

    it('should format milestone for colleagues', () => {
      const greeting = generateGreeting({
        recipientName: 'Elena',
        celebrationType: 'milestone',
        relationshipType: 'colleague',
        tone: 'fun',
      });

      expect(greeting).toContain('Elena');
      expect(greeting).toContain('Congrats');
    });
  });

  describe('Default Fallbacks', () => {
    it('should default to general relationship and warm tone when omitted', () => {
      const greeting = generateGreeting({
        recipientName: 'Sam',
        celebrationType: 'birthday',
      });

      expect(greeting).toContain('Sam');
      expect(greeting).toContain('Happy Birthday');
    });
  });
});
