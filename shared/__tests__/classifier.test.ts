import { classifyEvent } from '../classifier';

describe('Classifier Service (shared/classifier.ts)', () => {
  describe('Acceptance Criteria Cases', () => {
    it("should classify 'Sarah\\'s Birthday 🎂' as birthday with recipient 'Sarah'", () => {
      const result = classifyEvent("Sarah's Birthday 🎂");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('Sarah');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9);
    });

    it("should classify 'Wedding Anniversary 💍' as anniversary with null recipient name", () => {
      const result = classifyEvent('Wedding Anniversary 💍');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('anniversary');
      expect(result.recipientName).toBeNull();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.85);
    });

    it("should reject 'Team Standup' with isCelebration: false", () => {
      const result = classifyEvent('Team Standup');
      expect(result.isCelebration).toBe(false);
      expect(result.celebrationType).toBeNull();
      expect(result.recipientName).toBeNull();
      expect(result.confidenceScore).toBe(0);
    });

    it("should reject 'Doctor Appointment' with isCelebration: false", () => {
      const result = classifyEvent('Doctor Appointment');
      expect(result.isCelebration).toBe(false);
      expect(result.celebrationType).toBeNull();
      expect(result.recipientName).toBeNull();
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('Negative Filtering & Routine Events', () => {
    const routineEvents = [
      'Dentist Appointment',
      'Sprint Planning',
      '1:1 with Alex',
      'Weekly Sync',
      'Project Retrospective',
      'Flight to NYC',
      'Hotel Check-in',
      'Car Oil Change',
      'Vet Visit',
      'Morning Gym Workout',
      'Final Exam',
      'Company All-Hands',
    ];

    routineEvents.forEach((title) => {
      it(`should reject routine event: '${title}'`, () => {
        const result = classifyEvent(title);
        expect(result.isCelebration).toBe(false);
        expect(result.celebrationType).toBeNull();
        expect(result.recipientName).toBeNull();
        expect(result.confidenceScore).toBe(0);
      });
    });

    it('should handle empty or whitespace-only inputs', () => {
      expect(classifyEvent('').isCelebration).toBe(false);
      expect(classifyEvent('   ').isCelebration).toBe(false);
      expect(classifyEvent(undefined, undefined).isCelebration).toBe(false);
    });
  });

  describe('Name Extraction Heuristics', () => {
    it("Heuristic 1 (Possessive): extracts name from 'Dad\\'s 60th Bday'", () => {
      const result = classifyEvent("Dad's 60th Bday");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('Dad');
    });

    it("Heuristic 1 (Possessive Couple): extracts 'Sarah & David' from 'Sarah & David\\'s Wedding Anniversary 💍'", () => {
      const result = classifyEvent("Sarah & David's Wedding Anniversary 💍");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('anniversary');
      expect(result.recipientName).toBe('Sarah & David');
    });

    it("Heuristic 1 (Couple): extracts 'Mom & Dad' from 'Mom & Dad\\'s 50th Wedding Anniversary'", () => {
      const result = classifyEvent("Mom & Dad's 50th Wedding Anniversary");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('anniversary');
      expect(result.recipientName).toBe('Mom & Dad');
    });

    it("Heuristic 1 (Hyphenated): extracts name from 'Sarah\\'s B-Day'", () => {
      const result = classifyEvent("Sarah's B-Day");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('Sarah');
    });

    it("Heuristic 2 ('For' / 'Of' / 'With'): extracts name from 'Birthday for Sarah'", () => {
      const result = classifyEvent('Birthday for Sarah');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBe('Sarah');
    });

    it("Heuristic 2: extracts name from 'Surprise party for Emma 🎂 at 7pm'", () => {
      const result = classifyEvent('Surprise party for Emma 🎂 at 7pm');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBe('Emma');
    });

    it("Heuristic 3 (Delimiter suffix): extracts name from 'Birthday: Michael'", () => {
      const result = classifyEvent('Birthday: Michael');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBe('Michael');
    });

    it("Heuristic 3 (Delimiter prefix): extracts name from 'Sarah - Birthday 🎂'", () => {
      const result = classifyEvent('Sarah - Birthday 🎂');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBe('Sarah');
    });

    it("Heuristic 4 (Direct leading token): extracts name from 'Maya Birthday'", () => {
      const result = classifyEvent('Maya Birthday');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBe('Maya');
    });
  });

  describe('Stop-Word Guardrails', () => {
    it("should reject stop-word 'Our' in 'Our Anniversary ❤️'", () => {
      const result = classifyEvent('Our Anniversary ❤️');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('anniversary');
      expect(result.recipientName).toBeNull();
    });

    it("should reject stop-word 'Happy' in 'Happy Birthday!'", () => {
      const result = classifyEvent('Happy Birthday!');
      expect(result.isCelebration).toBe(true);
      expect(result.recipientName).toBeNull();
    });

    it("should reject stop-word 'Annual' in 'Annual Anniversary Party'", () => {
      const result = classifyEvent('Annual Anniversary Party');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('anniversary');
      expect(result.recipientName).toBeNull();
    });

    it("should reject stop-word 'My' in 'My Birthday 🎂'", () => {
      const result = classifyEvent('My Birthday 🎂');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBeNull();
    });

    it("should reject stop-word 'Team' in 'Team Birthday Celebration 🎉'", () => {
      const result = classifyEvent('Team Birthday Celebration 🎉');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBeNull();
    });
  });

  describe('Notes / Description Scanning', () => {
    it('should detect celebration from notes when title is generic', () => {
      const result = classifyEvent('Dinner reservation', "Sarah's 30th Birthday 🎂");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('Sarah');
    });

    it('should extract recipient name from notes if title has no name', () => {
      const result = classifyEvent('Birthday Party 🎈', 'Celebrating Michael today!');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
    });
  });

  describe('Milestone Celebrations', () => {
    it("should detect graduation milestone with recipient name", () => {
      const result = classifyEvent("Emma's Graduation 🎓");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('milestone');
      expect(result.recipientName).toBe('Emma');
    });

    it("should detect baby shower milestone with recipient name", () => {
      const result = classifyEvent('Baby shower for Jessica 👶');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('milestone');
      expect(result.recipientName).toBe('Jessica');
    });

    it("should detect retirement milestone with recipient name", () => {
      const result = classifyEvent("Tom's Retirement Party 🍾");
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('milestone');
      expect(result.recipientName).toBe('Tom');
    });
  });

  describe('Multilingual & Hebrew Celebrations', () => {
    it("should classify Hebrew birthday 'יום הולדת לשי בוש' with recipient 'שי בוש'", () => {
      const result = classifyEvent('יום הולדת לשי בוש');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('שי בוש');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.85);
    });

    it("should classify Hebrew birthday 'יומולדת של דנה' with recipient 'דנה'", () => {
      const result = classifyEvent('יומולדת של דנה');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
      expect(result.recipientName).toBe('דנה');
    });

    it("should classify Spanish birthday 'Cumpleaños de Carlos' as birthday", () => {
      const result = classifyEvent('Cumpleaños de Carlos');
      expect(result.isCelebration).toBe(true);
      expect(result.celebrationType).toBe('birthday');
    });
  });
});
