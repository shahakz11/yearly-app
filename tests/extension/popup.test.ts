import { setupMockEnvironment, MockElement, MockEvent } from './helpers/domMock';

describe('Popup Controller & UI (extension/popup/popup.js)', () => {
  let env: ReturnType<typeof setupMockEnvironment>;
  let popup: any;
  let storage: any;
  let core: any;

  beforeEach(() => {
    env = setupMockEnvironment();

    // Setup popup HTML structure in mock document.body
    env.document.body.innerHTML = '';
    const wrapper = env.document.createElement('div');
    wrapper.className = 'popup-wrapper';

    // Header
    const statusPill = env.document.createElement('span');
    statusPill.id = 'statusPill';
    statusPill.className = 'status-pill demo';
    statusPill.textContent = '● Demo Mode';

    const settingsToggleBtn = env.document.createElement('button');
    settingsToggleBtn.id = 'settingsToggleBtn';

    // Drawer
    const settingsDrawer = env.document.createElement('section');
    settingsDrawer.id = 'settingsDrawer';
    settingsDrawer.className = 'settings-drawer hidden';

    const closeSettingsBtn = env.document.createElement('button');
    closeSettingsBtn.id = 'closeSettingsBtn';

    const remind14d = env.document.createElement('input');
    remind14d.id = 'remind14d';
    remind14d.type = 'checkbox';

    const remind7d = env.document.createElement('input');
    remind7d.id = 'remind7d';
    remind7d.type = 'checkbox';

    const remind3d = env.document.createElement('input');
    remind3d.id = 'remind3d';
    remind3d.type = 'checkbox';

    const remind1d = env.document.createElement('input');
    remind1d.id = 'remind1d';
    remind1d.type = 'checkbox';

    const saveSettingsBtn = env.document.createElement('button');
    saveSettingsBtn.id = 'saveSettingsBtn';

    const connectionFeedback = env.document.createElement('div');
    connectionFeedback.id = 'connectionFeedback';

    settingsDrawer.appendChild(closeSettingsBtn);
    settingsDrawer.appendChild(remind14d);
    settingsDrawer.appendChild(remind7d);
    settingsDrawer.appendChild(remind3d);
    settingsDrawer.appendChild(remind1d);
    settingsDrawer.appendChild(saveSettingsBtn);
    settingsDrawer.appendChild(connectionFeedback);

    // Main
    const celebrationsContainer = env.document.createElement('main');
    celebrationsContainer.id = 'celebrationsContainer';

    const loadingIndicator = env.document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';

    const celebrationsList = env.document.createElement('div');
    celebrationsList.id = 'celebrationsList';

    const loadMoreContainer = env.document.createElement('div');
    loadMoreContainer.id = 'loadMoreContainer';
    loadMoreContainer.className = 'load-more-container hidden';

    const loadMoreBtn = env.document.createElement('button');
    loadMoreBtn.id = 'loadMoreBtn';
    loadMoreContainer.appendChild(loadMoreBtn);

    const emptyState = env.document.createElement('div');
    emptyState.id = 'emptyState';
    emptyState.className = 'empty-state hidden';

    celebrationsContainer.appendChild(loadingIndicator);
    celebrationsContainer.appendChild(celebrationsList);
    celebrationsContainer.appendChild(loadMoreContainer);
    celebrationsContainer.appendChild(emptyState);

    wrapper.appendChild(statusPill);
    wrapper.appendChild(settingsToggleBtn);
    wrapper.appendChild(settingsDrawer);
    wrapper.appendChild(celebrationsContainer);
    env.document.body.appendChild(wrapper);

    const mockEvents = [
      {
        id: 'evt-1',
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        date: '2026-10-15',
        daysUntil: 3
      },
      {
        id: 'evt-2',
        recipientName: 'Alex & Jordan',
        celebrationType: 'anniversary',
        date: '2026-10-20',
        daysUntil: 8
      }
    ];

    // Mock global fetch to return fast dummy JSON and avoid live network delays
    (global as any).fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          service: 'Auto-Gifter',
          celebrations: mockEvents
        })
      })
    );

    // Global mock dependencies
    core = require('../../extension/core/CoreEngine.js');
    (global as any).AutoGifterCore = core;

    delete require.cache[require.resolve('../../extension/storage.js')];
    storage = require('../../extension/storage.js');
    (global as any).AutoGifterStorage = storage;

    delete require.cache[require.resolve('../../extension/popup/popup.js')];
    popup = require('../../extension/popup/popup.js');
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('initializes and renders celebration cards', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        date: '2026-10-15',
        daysUntil: 3
      },
      {
        id: 'evt-2',
        recipientName: 'Alex & Jordan',
        celebrationType: 'anniversary',
        date: '2026-10-20',
        daysUntil: 8
      }
    ];
    await popup.init();
    await popup.refreshCelebrations(jest.fn().mockResolvedValue(mockEvents));

    const celebrationsList = env.document.getElementById('celebrationsList');
    const cards = celebrationsList?.querySelectorAll('.celebration-card') || [];
    expect(cards.length).toBeGreaterThanOrEqual(2);

    // Sarah's Birthday
    const sarahCard = cards[0];
    expect(sarahCard.textContent).toContain('Sarah');
    expect(sarahCard.textContent).toContain('Birthday');

    // Wedding Anniversary
    const annivCard = cards[1];
    expect(annivCard.textContent).toContain('Alex & Jordan');
    expect(annivCard.textContent).toContain('Anniversary');
  });

  it('renders FloristOne flower bouquets with 1-click cart URLs for celebrations', async () => {
    const mockEvents = [
      {
        id: 'evt-1',
        recipientName: 'Sarah',
        celebrationType: 'birthday',
        date: '2026-10-15',
        daysUntil: 3
      }
    ];
    await popup.init();
    await popup.refreshCelebrations(jest.fn().mockResolvedValue(mockEvents));

    const celebrationsList = env.document.getElementById('celebrationsList');
    const firstCard = celebrationsList?.querySelectorAll('.celebration-card')[0];
    expect(firstCard).toBeDefined();

    // Check FloristOne flower links
    const chips = firstCard?.querySelectorAll('.chip') || [];
    const flowerChips = chips.filter((c: any) => (c.getAttribute('href') || '').includes('floristone.com/cart.cfm'));
    expect(flowerChips.length).toBeGreaterThanOrEqual(1);

    const firstFlowerUrl = flowerChips[0].getAttribute('href') || '';
    expect(firstFlowerUrl).toContain('source_id=aff');
    expect(firstFlowerUrl).toContain('affiliateid=2026097209');
  });

  it('toggles the settings drawer when settings button is clicked', async () => {
    await popup.init();

    const settingsDrawer = env.document.getElementById('settingsDrawer');
    const settingsToggleBtn = env.document.getElementById('settingsToggleBtn');

    expect(settingsDrawer?.classList.contains('hidden')).toBe(true);

    settingsToggleBtn?.dispatchEvent(new MockEvent('click'));
    expect(settingsDrawer?.classList.contains('hidden')).toBe(false);

    settingsToggleBtn?.dispatchEvent(new MockEvent('click'));
    expect(settingsDrawer?.classList.contains('hidden')).toBe(true);
  });

  it('saves reminder preferences to storage and displays confirmation', async () => {
    await popup.init();

    const remind14d = env.document.getElementById('remind14d') as any;
    const remind7d = env.document.getElementById('remind7d') as any;
    const remind3d = env.document.getElementById('remind3d') as any;
    const remind1d = env.document.getElementById('remind1d') as any;

    remind14d.checked = true;
    remind7d.checked = true;
    remind3d.checked = true;
    remind1d.checked = false;

    await popup.savePopupSettings();

    const stored = await storage.getSettings();
    expect(stored.reminders).toEqual([14, 7, 3]);

    const feedback = env.document.getElementById('connectionFeedback');
    expect(feedback?.textContent).toContain('Reminder settings saved');
  });

  it('supports pagination displaying 8 events initially and expanding on load more', async () => {
    await popup.init();

    // Generate 12 mock celebrations
    const mock12Events = [];
    for (let i = 1; i <= 12; i++) {
      mock12Events.push({
        id: `evt-${i}`,
        recipientName: `Friend ${i}`,
        celebrationType: 'birthday',
        date: '2026-10-15',
        daysUntil: i
      });
    }

    const mockFetcher = jest.fn().mockResolvedValue(mock12Events);
    await popup.refreshCelebrations(mockFetcher);

    const celebrationsList = env.document.getElementById('celebrationsList');
    let cards = celebrationsList?.querySelectorAll('.celebration-card') || [];
    expect(cards.length).toBe(8); // First page of 8

    const loadMoreContainer = env.document.getElementById('loadMoreContainer');
    const loadMoreBtn = env.document.getElementById('loadMoreBtn');
    expect(loadMoreContainer?.classList.contains('hidden')).toBe(false);
    expect(loadMoreBtn?.textContent).toContain('+4');

    // Click load more
    loadMoreBtn?.dispatchEvent(new MockEvent('click'));
    cards = celebrationsList?.querySelectorAll('.celebration-card') || [];
    expect(cards.length).toBe(12); // All 12 now visible
    expect(loadMoreContainer?.classList.contains('hidden')).toBe(true);
  });

  it('switches to Connected status when GAS fetch succeeds', async () => {
    const liveFetcher = jest.fn().mockResolvedValue([
      {
        id: 'gas-evt-1',
        recipientName: 'Samantha',
        celebrationType: 'birthday',
        date: '2026-10-18',
        daysUntil: 6
      }
    ]);

    const result = await popup.refreshCelebrations(liveFetcher);

    expect(result.source).toBe('gas');
    expect(result.celebrations.length).toBe(1);

    const statusPill = env.document.getElementById('statusPill');
    expect(statusPill?.textContent).toContain('Calendar Ready');
    expect(statusPill?.className).toContain('connected');

    const celebrationsList = env.document.getElementById('celebrationsList');
    expect(celebrationsList?.textContent).toContain('Samantha');
  });

  it('handles HTML login / permission denied response gracefully with clear diagnostics', async () => {
    (global as any).fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: async () => '<html><head><title>Google Drive</title></head><body><div class="header">דרושה לך הרשאת גישה</div></body></html>'
      })
    );

    const result = await storage.syncAllCelebrations(30);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Google Apps Script permission denied');
  });
});
