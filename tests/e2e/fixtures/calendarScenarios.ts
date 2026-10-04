/**
 * Synthetic Calendar Scenarios and Test Fixtures
 * Derived from ORIGINAL_REQUEST.md and PROJECT.md requirements
 */

export interface CalendarEventScenario {
  id: string;
  title: string;
  notes?: string;
  startDate: string;
  endDate?: string;
  expected: {
    isCelebration: boolean;
    celebrationType?: 'birthday' | 'anniversary' | 'milestone' | null;
    recipientName?: string | null;
    shouldInjectBadge: boolean;
  };
}

export const POSITIVE_SCENARIOS: CalendarEventScenario[] = [
  {
    id: 'evt-pos-001',
    title: "Sarah's Birthday 🎂",
    startDate: '2026-10-15T09:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Sarah',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-002',
    title: "Bob's 30th Bday",
    startDate: '2026-10-18T10:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Bob',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-003',
    title: "Mom's Birthday Party 🎉",
    startDate: '2026-10-22T18:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Mom',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-004',
    title: 'Happy Birthday Alex! 🎈',
    startDate: '2026-10-25T12:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Alex',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-005',
    title: 'Birthday Celebration for Michael',
    startDate: '2026-10-28T19:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Michael',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-006',
    title: 'Wedding Anniversary 💍',
    startDate: '2026-11-02T18:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'anniversary',
      recipientName: null,
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-007',
    title: "Dave & Alice's Wedding Anniversary 💍",
    startDate: '2026-11-05T19:30:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'anniversary',
      recipientName: 'Dave & Alice',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-008',
    title: 'Mark & Jenny’s 5th Anniversary 🥂',
    startDate: '2026-11-10T20:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'anniversary',
      recipientName: 'Mark & Jenny',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-009',
    title: 'Family Gathering',
    notes: "Celebrating John's retirement milestone party with the family 🎊",
    startDate: '2026-11-12T14:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'milestone',
      recipientName: 'John',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-pos-010',
    title: "Grandma's 90th Milestone Celebration 🎂",
    startDate: '2026-11-15T15:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Grandma',
      shouldInjectBadge: true,
    },
  },
];

export const NEGATIVE_SCENARIOS: CalendarEventScenario[] = [
  {
    id: 'evt-neg-001',
    title: 'Team Standup',
    startDate: '2026-10-15T09:30:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-002',
    title: 'Doctor Appointment',
    startDate: '2026-10-16T14:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-003',
    title: 'Sprint Planning',
    startDate: '2026-10-17T11:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-004',
    title: 'Dentist Appointment',
    startDate: '2026-10-19T08:30:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-005',
    title: '1:1 with Alex',
    startDate: '2026-10-20T16:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-006',
    title: 'Quarterly Financial Review',
    startDate: '2026-10-21T13:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-007',
    title: 'Lunch with Dave',
    startDate: '2026-10-23T12:30:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-008',
    title: 'Birthday Problem Math Seminar',
    notes: 'Probability lecture covering the birthday paradox in mathematics',
    startDate: '2026-10-24T15:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-009',
    title: 'Doctor Appointment - Dr. Day',
    startDate: '2026-10-26T10:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-neg-010',
    title: 'Annual Performance Review Sync',
    startDate: '2026-10-27T14:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
];

export const BOUNDARY_SCENARIOS: CalendarEventScenario[] = [
  {
    id: 'evt-bnd-001',
    title: '',
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-bnd-002',
    title: '   ',
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: false,
      celebrationType: null,
      recipientName: null,
      shouldInjectBadge: false,
    },
  },
  {
    id: 'evt-bnd-003',
    title: '🎂',
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: null,
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-004',
    title: '*** SARAH\'S B-DAY!!! ***',
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'SARAH',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-005',
    title: "Zoë's Birthday 🎂",
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Zoë',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-006',
    title: "José's Bday 🎉",
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'José',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-007',
    title: "Mary-Jane's Birthday 🎂",
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Mary-Jane',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-008',
    title: 'Surprise Birthday Party',
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: null, // "Party" is a stop-word, not a person
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-009',
    title: "Sarah's 3-Day Birthday Vacation 🎂",
    startDate: '2026-10-15T00:00:00Z',
    endDate: '2026-10-18T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'birthday',
      recipientName: 'Sarah',
      shouldInjectBadge: true,
    },
  },
  {
    id: 'evt-bnd-010',
    title: 'Anniversary Dinner 💍',
    notes: undefined,
    startDate: '2026-10-15T00:00:00Z',
    expected: {
      isCelebration: true,
      celebrationType: 'anniversary',
      recipientName: null,
      shouldInjectBadge: true,
    },
  },
];
