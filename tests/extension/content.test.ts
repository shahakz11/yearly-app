import { setupMockEnvironment, MockElement, MockEvent } from './helpers/domMock';

describe('Content Script & Calendar DOM Injection (extension/content/content.js)', () => {
  let env: ReturnType<typeof setupMockEnvironment>;
  let content: any;
  let core: any;

  beforeEach(() => {
    env = setupMockEnvironment();
    // Load CoreEngine into mock global scope
    core = require('../../extension/core/CoreEngine.js');
    (global as any).AutoGifterCore = core;
    // Load content script
    delete require.cache[require.resolve('../../extension/content/content.js')];
    content = require('../../extension/content/content.js');
  });

  afterEach(() => {
    content.closeGiftModal();
  });

  function createCalendarGrid(): {
    birthdayChip: MockElement;
    anniversaryChip: MockElement;
    standupChip: MockElement;
    doctorChip: MockElement;
  } {
    const grid = env.document.createElement('div');
    grid.setAttribute('role', 'main');

    // Positive: Sarah's Birthday
    const birthdayChip = env.document.createElement('div');
    birthdayChip.setAttribute('data-eventchip', 'true');
    birthdayChip.setAttribute('data-eventid', 'evt-sarah-101');
    birthdayChip.setAttribute('role', 'button');
    birthdayChip.setAttribute('aria-label', "Sarah's Birthday 🎂, All day, Friday, October 2, 2026, Calendar: Personal");
    const bSpan = env.document.createElement('span');
    bSpan.textContent = "Sarah's Birthday 🎂";
    birthdayChip.appendChild(bSpan);

    // Positive: Wedding Anniversary
    const anniversaryChip = env.document.createElement('div');
    anniversaryChip.setAttribute('data-eventchip', 'true');
    anniversaryChip.setAttribute('data-eventid', 'evt-anniv-102');
    anniversaryChip.setAttribute('role', 'button');
    anniversaryChip.setAttribute('aria-label', "Wedding Anniversary 💍, 7:00pm, Sunday, October 4, 2026");
    const aSpan = env.document.createElement('span');
    aSpan.textContent = "Wedding Anniversary 💍";
    anniversaryChip.appendChild(aSpan);

    // Negative: Team Standup
    const standupChip = env.document.createElement('div');
    standupChip.setAttribute('data-eventchip', 'true');
    standupChip.setAttribute('data-eventid', 'evt-standup-103');
    standupChip.setAttribute('role', 'button');
    standupChip.setAttribute('aria-label', "Team Standup, 10:00am to 10:30am, Monday, October 5, 2026");
    const sSpan = env.document.createElement('span');
    sSpan.textContent = "Team Standup";
    standupChip.appendChild(sSpan);

    // Negative: Doctor Appointment
    const doctorChip = env.document.createElement('div');
    doctorChip.setAttribute('data-eventchip', 'true');
    doctorChip.setAttribute('data-eventid', 'evt-doc-104');
    doctorChip.setAttribute('role', 'button');
    doctorChip.setAttribute('aria-label', "Doctor Appointment, 2:00pm, Wednesday, October 7, 2026");
    const dSpan = env.document.createElement('span');
    dSpan.textContent = "Doctor Appointment";
    doctorChip.appendChild(dSpan);

    grid.appendChild(birthdayChip);
    grid.appendChild(anniversaryChip);
    grid.appendChild(standupChip);
    grid.appendChild(doctorChip);
    env.document.body.appendChild(grid);

    return { birthdayChip, anniversaryChip, standupChip, doctorChip };
  }

  it('scans Google Calendar grid and injects 🎁 badges only on celebration events', () => {
    const { birthdayChip, anniversaryChip, standupChip, doctorChip } = createCalendarGrid();

    const injected = content.scanAndInjectBadges(env.document.body);
    expect(injected).toBe(2);

    const bBadge = birthdayChip.querySelector('.autogifter-badge');
    expect(bBadge).not.toBeNull();
    expect(bBadge?.textContent).toBe('🎁');
    expect(birthdayChip.getAttribute('data-autogifter-injected')).toBe('true');

    const aBadge = anniversaryChip.querySelector('.autogifter-badge');
    expect(aBadge).not.toBeNull();
    expect(aBadge?.textContent).toBe('🎁');
    expect(anniversaryChip.getAttribute('data-autogifter-injected')).toBe('true');

    // Negatives should NOT have badges
    expect(standupChip.querySelector('.autogifter-badge')).toBeNull();
    expect(standupChip.getAttribute('data-autogifter-injected')).toBeNull();

    expect(doctorChip.querySelector('.autogifter-badge')).toBeNull();
    expect(doctorChip.getAttribute('data-autogifter-injected')).toBeNull();
  });

  it('enforces strict idempotency on repeated scan passes', () => {
    const { birthdayChip } = createCalendarGrid();

    const firstPass = content.scanAndInjectBadges(env.document.body);
    expect(firstPass).toBe(2);
    expect(birthdayChip.querySelectorAll('.autogifter-badge').length).toBe(1);

    // Second pass must skip already-injected chips
    const secondPass = content.scanAndInjectBadges(env.document.body);
    expect(secondPass).toBe(0);
    expect(birthdayChip.querySelectorAll('.autogifter-badge').length).toBe(1);
  });

  it('isolates click events on the badge with stopPropagation and preventDefault', () => {
    const { birthdayChip } = createCalendarGrid();
    content.scanAndInjectBadges(env.document.body);

    const badge = birthdayChip.querySelector('.autogifter-badge');
    expect(badge).not.toBeNull();

    let calendarChipClicked = false;
    birthdayChip.addEventListener('click', () => {
      calendarChipClicked = true;
    });

    const clickEvt = new MockEvent('click', { bubbles: true });
    badge?.dispatchEvent(clickEvt);

    expect(clickEvt.defaultPrevented).toBe(true);
    expect(clickEvt.propagationStopped).toBe(true);
    expect(calendarChipClicked).toBe(false);
  });

  it('opens an inline gift modal when the badge is clicked', () => {
    const { birthdayChip } = createCalendarGrid();
    content.scanAndInjectBadges(env.document.body);

    const badge = birthdayChip.querySelector('.autogifter-badge');
    const clickEvt = new MockEvent('click', { bubbles: true });
    badge?.dispatchEvent(clickEvt);

    const modal = env.document.getElementById('autogifter-modal');
    expect(modal).not.toBeNull();

    const titleText = modal?.textContent || '';
    expect(titleText).toContain('Sarah');

    // FloristOne bouquets present with 1-click order buttons
    const bouquetCards = modal?.querySelectorAll('.autogifter-bouquet-card') || [];
    expect(bouquetCards.length).toBeGreaterThanOrEqual(1);

    const orderLinks = modal?.querySelectorAll('.autogifter-btn-order') || [];
    expect(orderLinks.length).toBeGreaterThanOrEqual(1);
    const firstOrderUrl = orderLinks[0].getAttribute('href') || '';
    expect(firstOrderUrl).toContain('floristone.com/cart.cfm');
    expect(firstOrderUrl).toContain('affiliateid=2026097209');
  });

  it('renders direct FloristOne cart order links for all top bouquets', () => {
    const { birthdayChip } = createCalendarGrid();
    content.scanAndInjectBadges(env.document.body);

    const badge = birthdayChip.querySelector('.autogifter-badge');
    badge?.dispatchEvent(new MockEvent('click', { bubbles: true }));

    const modal = env.document.getElementById('autogifter-modal');
    const orderBtns = modal?.querySelectorAll('.autogifter-btn-order') || [];
    expect(orderBtns.length).toBeGreaterThanOrEqual(1);

    orderBtns.forEach((btn: any) => {
      const url = btn.getAttribute('href') || '';
      expect(url).toContain('floristone.com/cart.cfm');
      expect(url).toContain('source_id=aff');
      expect(url).toContain('affiliateid=2026097209');
    });
  });

  it('extracts clean event title stripping attendee, location and date metadata', () => {
    const complexChip = env.document.createElement('div');
    complexChip.setAttribute('data-eventchip', 'true');
    complexChip.setAttribute('data-eventid', 'evt-complex-105');
    complexChip.setAttribute('role', 'button');
    complexChip.setAttribute('aria-label', "🎂 Omer ArvivTodo el día, 🎂 Omer Arviv, Shahak Zukerman, Sin ubicación, 14 de octubre de 2026");

    const title = content.extractTitleFromChip(complexChip);
    expect(title).toBe('🎂 Omer Arviv');

    const sarahChip = env.document.createElement('div');
    sarahChip.setAttribute('data-eventchip', 'true');
    sarahChip.setAttribute('data-eventid', 'evt-sarah-106');
    sarahChip.setAttribute('role', 'button');
    sarahChip.setAttribute('aria-label', "🎂 Sarah's Birthday 🎂, Shahak Zukerman, Sin ubicación, 12 de octubre de 2026");

    const sarahTitle = content.extractTitleFromChip(sarahChip);
    expect(sarahTitle).toBe("🎂 Sarah's Birthday 🎂");
  });

  it('renders clean title, price tag, and clean CTA button in gift modal with accordion toggle', () => {
    const modal = content.openGiftModal({
      recipientName: 'Omer Arviv',
      celebrationType: 'birthday',
      rawTitle: '🎂 Omer ArvivTodo el día, Shahak Zukerman, Sin ubicación, 14 de octubre de 2026'
    });

    const titleEl = modal?.querySelector('.autogifter-modal-title');
    expect(titleEl?.textContent).toBe('🎂 Omer Arviv');

    const priceEl = modal?.querySelector('.autogifter-bouquet-price');
    expect(priceEl?.textContent).toMatch(/^\$\d+\.\d{2}$/);

    const orderBtns = modal?.querySelectorAll('.autogifter-btn-order') || [];
    expect(orderBtns.length).toBeGreaterThanOrEqual(1);
    expect(orderBtns[0].textContent).toBe('🛒 Order on FloristOne');

    const cards = modal?.querySelectorAll('.autogifter-bouquet-card') || [];
    expect(cards.length).toBeGreaterThanOrEqual(2);

    // First card should be active initially
    expect(cards[0].classList.contains('active')).toBe(true);
    expect(cards[1].classList.contains('active')).toBe(false);

    // Clicking active card collapses it
    cards[0].dispatchEvent(new MockEvent('click', { bubbles: true }));
    expect(cards[0].classList.contains('active')).toBe(false);

    // Clicking second card expands it
    cards[1].dispatchEvent(new MockEvent('click', { bubbles: true }));
    expect(cards[0].classList.contains('active')).toBe(false);
    expect(cards[1].classList.contains('active')).toBe(true);

    // Verify affiliate disclosure element
    const disclosureEl = modal?.querySelector('.autogifter-modal-disclosure');
    expect(disclosureEl).toBeDefined();
    expect(disclosureEl?.textContent).toContain('affiliate');
  });

  it('scans DOM celebrations into structured items and responds to scan_calendar message', () => {
    const { birthdayChip, anniversaryChip } = createCalendarGrid();
    const items = content.scanCelebrationEvents(env.document.body);
    expect(items.length).toBe(2);
    expect(items[0].recipientName).toBe('Sarah');
    expect(items[1].celebrationType).toBe('anniversary');

    let responseData: any = null;
    content.handleRuntimeMessage(
      { action: 'scan_calendar' },
      {},
      (res: any) => {
        responseData = res;
      }
    );

    expect(responseData).not.toBeNull();
    expect(responseData.ok).toBe(true);
    expect(responseData.count).toBe(2);
    expect(responseData.celebrations.length).toBe(2);
  });
});
