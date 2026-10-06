/**
 * In-Memory Hermetic Mocks for Google Apps Script Services
 *
 * Mocks provided:
 * - CardService: UI components AST builder
 * - CalendarApp: Calendars and events store
 * - SpreadsheetApp: Spreadsheets, sheets, ranges, and cell mutation
 * - PropertiesService: User & Script persistent properties
 * - ContentService: Web App TextOutput with MIME types
 * - ScriptApp: Project time-driven triggers
 */

// ==========================================
// 1. CardService Mocks
// ==========================================

export class MockCardService {
  static Icon = {
    STAR: 'STAR',
    EVENT: 'EVENT',
    BOOKMARK: 'BOOKMARK',
    PERSON: 'PERSON'
  };

  static OpenAs = {
    FULL_SIZE: 'FULL_SIZE',
    OVERLAY: 'OVERLAY'
  };

  static TextButtonStyle = {
    FILLED: 'FILLED',
    TEXT: 'TEXT'
  };

  static NotificationType = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
  };

  static SelectionInputType = {
    CHECK_BOX: 'CHECK_BOX',
    RADIO_BUTTON: 'RADIO_BUTTON',
    DROPDOWN: 'DROPDOWN',
    SWITCH: 'SWITCH'
  };

  static ImageStyle = {
    SQUARE: 'SQUARE',
    CIRCLE: 'CIRCLE'
  };

  static newCardBuilder() {
    return new MockCardBuilder();
  }

  static newCardHeader() {
    return new MockCardHeader();
  }

  static newCardSection() {
    return new MockCardSection();
  }

  static newDecoratedText() {
    return new MockDecoratedText();
  }

  static newImage() {
    return new MockImage();
  }

  static newTextParagraph() {
    return new MockTextParagraph();
  }

  static newTextInput() {
    return new MockTextInput();
  }

  static newSelectionInput() {
    return new MockSelectionInput();
  }

  static newButtonSet() {
    return new MockButtonSet();
  }

  static newTextButton() {
    return new MockTextButton();
  }

  static newOpenLink() {
    return new MockOpenLink();
  }

  static newAction() {
    return new MockAction();
  }

  static newActionResponseBuilder() {
    return new MockActionResponseBuilder();
  }

  static newNotification() {
    return new MockNotification();
  }
}

export class MockSelectionInput {
  public type: string = 'CHECK_BOX';
  public fieldName: string = '';
  public title: string = '';
  public items: { text: string; value: string; selected: boolean }[] = [];

  setType(t: string) {
    this.type = t;
    return this;
  }

  setFieldName(name: string) {
    this.fieldName = name;
    return this;
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  addItem(text: string, value: string, selected = false) {
    this.items.push({ text, value, selected });
    return this;
  }
}

export class MockCardBuilder {
  private header: MockCardHeader | null = null;
  private sections: MockCardSection[] = [];

  setHeader(h: MockCardHeader) {
    this.header = h;
    return this;
  }

  addSection(s: MockCardSection) {
    this.sections.push(s);
    return this;
  }

  build() {
    return {
      type: 'Card',
      header: this.header ? this.header.build() : null,
      sections: this.sections.map(s => s.build())
    };
  }
}

export class MockCardHeader {
  private title = '';
  private subtitle = '';
  private imageUrl = '';
  private imageStyle = '';

  setTitle(t: string) {
    this.title = t;
    return this;
  }

  setSubtitle(s: string) {
    this.subtitle = s;
    return this;
  }

  setImageUrl(u: string) {
    this.imageUrl = u;
    return this;
  }

  setImageStyle(style: any) {
    this.imageStyle = style;
    return this;
  }

  build() {
    return {
      title: this.title,
      subtitle: this.subtitle,
      imageUrl: this.imageUrl,
      imageStyle: this.imageStyle
    };
  }
}

export class MockCardSection {
  private header = '';
  private widgets: any[] = [];

  setHeader(h: string) {
    this.header = h;
    return this;
  }

  addWidget(w: any) {
    this.widgets.push(w);
    return this;
  }

  build() {
    return {
      type: 'Section',
      header: this.header,
      widgets: this.widgets.map(w => (w && typeof w.build === 'function') ? w.build() : w)
    };
  }
}

export class MockDecoratedText {
  private topLabel = '';
  private text = '';
  private bottomLabel = '';
  private wrapText = true;
  private onClickAction: any = null;
  private openLink: any = null;

  setTopLabel(l: string) {
    this.topLabel = l;
    return this;
  }

  setText(t: string) {
    this.text = t;
    return this;
  }

  setBottomLabel(l: string) {
    this.bottomLabel = l;
    return this;
  }

  setWrapText(w: boolean) {
    this.wrapText = w;
    return this;
  }

  setOnClickAction(action: any) {
    this.onClickAction = action;
    return this;
  }

  setOpenLink(openLink: any) {
    this.openLink = openLink;
    return this;
  }

  build() {
    return {
      type: 'DecoratedText',
      topLabel: this.topLabel,
      text: this.text,
      bottomLabel: this.bottomLabel,
      wrapText: this.wrapText,
      onClickAction: this.onClickAction,
      openLink: this.openLink
    };
  }
}

export class MockImage {
  private imageUrl = '';
  private altText = '';

  setImageUrl(u: string) {
    this.imageUrl = u;
    return this;
  }

  setAltText(a: string) {
    this.altText = a;
    return this;
  }

  build() {
    return {
      type: 'Image',
      imageUrl: this.imageUrl,
      altText: this.altText
    };
  }
}

export class MockTextParagraph {
  private text = '';

  setText(t: string) {
    this.text = t;
    return this;
  }

  build() {
    return {
      type: 'TextParagraph',
      text: this.text
    };
  }
}

export class MockTextInput {
  private fieldName = '';
  private title = '';
  private value = '';
  private multiline = false;

  setFieldName(name: string) {
    this.fieldName = name;
    return this;
  }

  setTitle(title: string) {
    this.title = title;
    return this;
  }

  setValue(value: string) {
    this.value = value;
    return this;
  }

  setHint(_hint: string) {
    return this;
  }

  setMultiline(m: boolean) {
    this.multiline = m;
    return this;
  }

  build() {
    return {
      type: 'TextInput',
      fieldName: this.fieldName,
      title: this.title,
      value: this.value,
      multiline: this.multiline
    };
  }
}

export class MockButtonSet {
  private buttons: MockTextButton[] = [];

  addButton(b: MockTextButton) {
    this.buttons.push(b);
    return this;
  }

  build() {
    return {
      type: 'ButtonSet',
      buttons: this.buttons.map(b => b.build())
    };
  }
}

export class MockTextButton {
  private text = '';
  private style = 'TEXT';
  private openLink: any = null;
  private onClickAction: any = null;
  private onClickOpenLinkAction: any = null;

  setText(t: string) {
    this.text = t;
    return this;
  }

  setTextButtonStyle(s: string) {
    this.style = s;
    return this;
  }

  setOpenLink(ol: any) {
    this.openLink = ol;
    return this;
  }

  setOnClickAction(a: any) {
    this.onClickAction = a;
    return this;
  }

  setOnClickOpenLinkAction(a: any) {
    this.onClickOpenLinkAction = a;
    return this;
  }

  build() {
    return {
      type: 'TextButton',
      text: this.text,
      style: this.style,
      openLink: this.openLink ? this.openLink.build() : null,
      onClickAction: this.onClickAction ? this.onClickAction.build() : null,
      onClickOpenLinkAction: this.onClickOpenLinkAction ? this.onClickOpenLinkAction.build() : null
    };
  }
}

export class MockOpenLink {
  private url = '';
  private openAs = 'FULL_SIZE';

  setUrl(u: string) {
    this.url = u;
    return this;
  }

  setOpenAs(oa: string) {
    this.openAs = oa;
    return this;
  }

  build() {
    return {
      type: 'OpenLink',
      url: this.url,
      openAs: this.openAs
    };
  }
}

export class MockAction {
  private functionName = '';
  private parameters: Record<string, string> = {};

  setFunctionName(fn: string) {
    this.functionName = fn;
    return this;
  }

  setParameters(p: Record<string, string>) {
    this.parameters = p;
    return this;
  }

  build() {
    return {
      type: 'Action',
      functionName: this.functionName,
      parameters: this.parameters
    };
  }
}

export class MockNotification {
  private text = '';
  private type = 'INFO';

  setText(t: string) {
    this.text = t;
    return this;
  }

  setType(type: string) {
    this.type = type;
    return this;
  }

  build() {
    return {
      type: 'Notification',
      text: this.text,
      notificationType: this.type
    };
  }
}

export class MockActionResponseBuilder {
  private notification: MockNotification | null = null;
  private openLink: MockOpenLink | null = null;

  setNotification(n: MockNotification) {
    this.notification = n;
    return this;
  }

  setOpenLink(ol: MockOpenLink) {
    this.openLink = ol;
    return this;
  }

  build() {
    return {
      type: 'ActionResponse',
      notification: this.notification ? this.notification.build() : null,
      openLink: this.openLink ? this.openLink.build() : null
    };
  }
}

// ==========================================
// 2. CalendarApp Mocks
// ==========================================

export class MockCalendarEvent {
  private id: string;
  private title: string;
  private description: string;
  private startTime: Date;
  private endTime: Date;

  private isAllDay: boolean = true;
  private allDayStartDate?: Date;

  constructor(id: string, title: string, startTime: Date, endTime: Date, description = '', isAllDay = true) {
    this.id = id;
    this.title = title;
    this.startTime = startTime;
    this.endTime = endTime;
    this.description = description;
    this.isAllDay = isAllDay;
    if (isAllDay) {
      this.allDayStartDate = startTime;
    }
  }

  getId() {
    return this.id;
  }

  getTitle() {
    return this.title;
  }

  setTitle(t: string) {
    this.title = t;
    return this;
  }

  getDescription() {
    return this.description;
  }

  setDescription(d: string) {
    this.description = d;
    return this;
  }

  getStartTime() {
    return this.startTime;
  }

  setStartTime(t: Date) {
    this.startTime = t;
    return this;
  }

  getEndTime() {
    return this.endTime;
  }

  isAllDayEvent() {
    return this.isAllDay;
  }

  setIsAllDayEvent(allDay: boolean) {
    this.isAllDay = allDay;
    return this;
  }

  getAllDayStartDate() {
    return this.allDayStartDate || this.startTime;
  }

  private reminders: number[] = [];

  addPopupReminder(minutes: number) {
    this.reminders.push(minutes);
    return this;
  }

  removeAllReminders() {
    this.reminders = [];
    return this;
  }

  getPopupReminders(): number[] {
    return [...this.reminders];
  }
}

export class MockCalendar {
  private id: string;
  private name: string;
  private isOwned: boolean;
  private events: MockCalendarEvent[] = [];

  constructor(id = 'primary', name = 'Primary Calendar', isOwned = true) {
    this.id = id;
    this.name = name;
    this.isOwned = isOwned;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  isOwnedByMe() {
    return this.isOwned;
  }

  getTimeZone() {
    return 'America/New_York';
  }

  addEvent(event: MockCalendarEvent) {
    this.events.push(event);
    return event;
  }

  createEvent(title: string, startTime: Date, endTime: Date, options?: { description?: string }) {
    const id = 'evt_' + Math.random().toString(36).substring(2, 9);
    const event = new MockCalendarEvent(id, title, startTime, endTime, options ? options.description : '', false);
    this.events.push(event);
    return event;
  }

  createAllDayEvent(title: string, startDate: Date, options?: { description?: string }) {
    const id = 'evt_allday_' + Math.random().toString(36).substring(2, 9);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const event = new MockCalendarEvent(id, title, startDate, endDate, options ? options.description : '', true);
    this.events.push(event);
    return event;
  }

  getEventById(id: string) {
    return this.events.find(e => e.getId() === id) || null;
  }

  getEvents(startTime: Date, endTime: Date) {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    return this.events.filter(e => {
      const eStart = e.getStartTime().getTime();
      const eEnd = e.getEndTime().getTime();
      return eStart <= endMs && eEnd >= startMs;
    });
  }

  clearEvents() {
    this.events = [];
  }
}

export class MockCalendarApp {
  private static defaultCalendar = new MockCalendar('primary', 'Default Calendar', true);
  private static calendars = new Map<string, MockCalendar>([['primary', MockCalendarApp.defaultCalendar]]);

  static getDefaultCalendar() {
    return MockCalendarApp.defaultCalendar;
  }

  static getCalendarById(id: string) {
    let cal = MockCalendarApp.calendars.get(id);
    if (!cal) {
      const isOwned = !id.includes('holiday') && !id.includes('contacts') && !id.includes('group.v.calendar');
      cal = new MockCalendar(id, 'Calendar ' + id, isOwned);
      MockCalendarApp.calendars.set(id, cal);
    }
    return cal;
  }

  static getAllCalendars() {
    return Array.from(MockCalendarApp.calendars.values());
  }

  static getAllOwnedCalendars() {
    return Array.from(MockCalendarApp.calendars.values()).filter(c => c.isOwnedByMe());
  }

  static setCalendar(id: string, cal: MockCalendar) {
    MockCalendarApp.calendars.set(id, cal);
  }

  static reset() {
    MockCalendarApp.defaultCalendar.clearEvents();
    MockCalendarApp.calendars.clear();
    MockCalendarApp.calendars.set('primary', MockCalendarApp.defaultCalendar);
  }
}

// ==========================================
// 3. SpreadsheetApp Mocks
// ==========================================

export class MockRange {
  private sheet: MockSheet;
  private startRow: number; // 1-indexed
  private startCol: number; // 1-indexed
  private numRows: number;
  private numCols: number;

  constructor(sheet: MockSheet, startRow: number, startCol: number, numRows = 1, numCols = 1) {
    this.sheet = sheet;
    this.startRow = startRow;
    this.startCol = startCol;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValue() {
    return this.sheet.getCellValue(this.startRow, this.startCol);
  }

  setValue(val: any) {
    this.sheet.setCellValue(this.startRow, this.startCol, val);
    return this;
  }

  getValues() {
    const res: any[][] = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowArr: any[] = [];
      for (let c = 0; c < this.numCols; c++) {
        rowArr.push(this.sheet.getCellValue(this.startRow + r, this.startCol + c));
      }
      res.push(rowArr);
    }
    return res;
  }

  setValues(values: any[][]) {
    for (let r = 0; r < values.length && r < this.numRows; r++) {
      for (let c = 0; c < values[r].length && c < this.numCols; c++) {
        this.sheet.setCellValue(this.startRow + r, this.startCol + c, values[r][c]);
      }
    }
    return this;
  }

  setFontWeight(_weight: string) {
    return this;
  }

  setBackground(_color: string) {
    return this;
  }
}

export class MockSheet {
  private name: string;
  private cells: any[][] = []; // 0-indexed internally

  constructor(name: string) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  appendRow(rowValues: any[]) {
    this.cells.push([...rowValues]);
    return this;
  }

  getLastRow() {
    return this.cells.length;
  }

  getLastColumn() {
    let max = 0;
    for (const r of this.cells) {
      if (r.length > max) max = r.length;
    }
    return max;
  }

  getDataRange() {
    const numRows = Math.max(1, this.getLastRow());
    const numCols = Math.max(1, this.getLastColumn());
    return new MockRange(this, 1, 1, numRows, numCols);
  }

  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    return new MockRange(this, row, col, numRows, numCols);
  }

  getCellValue(row: number, col: number) {
    const rIdx = row - 1;
    const cIdx = col - 1;
    if (rIdx >= 0 && rIdx < this.cells.length) {
      const rowArr = this.cells[rIdx];
      if (cIdx >= 0 && cIdx < rowArr.length) {
        return rowArr[cIdx];
      }
    }
    return '';
  }

  setCellValue(row: number, col: number, val: any) {
    const rIdx = row - 1;
    const cIdx = col - 1;
    while (this.cells.length <= rIdx) {
      this.cells.push([]);
    }
    const rowArr = this.cells[rIdx];
    while (rowArr.length <= cIdx) {
      rowArr.push('');
    }
    rowArr[cIdx] = val;
  }

  getParent() {
    return MockSpreadsheetApp.getActiveSpreadsheet();
  }

  getRawRows() {
    return this.cells;
  }

  clear() {
    this.cells = [];
  }
}

export class MockSpreadsheet {
  private id: string;
  private name: string;
  private sheets: MockSheet[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getSheetByName(name: string) {
    return this.sheets.find(s => s.getName() === name) || null;
  }

  insertSheet(name: string) {
    const s = new MockSheet(name);
    this.sheets.push(s);
    return s;
  }

  getSheets() {
    return this.sheets;
  }

  getActiveSheet() {
    return this.sheets[0] || null;
  }
}

export class MockSpreadsheetApp {
  private static spreadsheets = new Map<string, MockSpreadsheet>();
  private static activeSpreadsheet: MockSpreadsheet | null = null;

  static create(name: string) {
    const id = 'ss_' + Math.random().toString(36).substring(2, 9);
    const ss = new MockSpreadsheet(id, name);
    MockSpreadsheetApp.spreadsheets.set(id, ss);
    MockSpreadsheetApp.activeSpreadsheet = ss;
    return ss;
  }

  static openById(id: string) {
    const ss = MockSpreadsheetApp.spreadsheets.get(id);
    if (!ss) {
      throw new Error(`Spreadsheet with id ${id} not found.`);
    }
    return ss;
  }

  static getActiveSpreadsheet() {
    return MockSpreadsheetApp.activeSpreadsheet;
  }

  static reset() {
    MockSpreadsheetApp.spreadsheets.clear();
    MockSpreadsheetApp.activeSpreadsheet = null;
  }
}

// ==========================================
// 4. ContentService Mocks
// ==========================================

export class MockTextOutput {
  private content = '';
  private mimeType = 'text/plain';

  constructor(content = '') {
    this.content = content;
  }

  setContent(c: string) {
    this.content = c;
    return this;
  }

  getContent() {
    return this.content;
  }

  setMimeType(m: string) {
    this.mimeType = m;
    return this;
  }

  getMimeType() {
    return this.mimeType;
  }
}

export class MockContentService {
  static MimeType = {
    JSON: 'application/json',
    TEXT: 'text/plain',
    CSV: 'text/csv'
  };

  static createTextOutput(content = '') {
    return new MockTextOutput(content);
  }
}

// ==========================================
// 5. PropertiesService Mocks
// ==========================================

export class MockProperties {
  private map = new Map<string, string>();

  getProperty(key: string) {
    return this.map.get(key) || null;
  }

  setProperty(key: string, value: string) {
    this.map.set(key, String(value));
    return this;
  }

  deleteProperty(key: string) {
    this.map.delete(key);
    return this;
  }

  deleteAllProperties() {
    this.map.clear();
    return this;
  }

  getProperties() {
    const res: Record<string, string> = {};
    this.map.forEach((v, k) => { res[k] = v; });
    return res;
  }
}

export class MockPropertiesService {
  private static userProperties = new MockProperties();
  private static scriptProperties = new MockProperties();

  static getUserProperties() {
    return MockPropertiesService.userProperties;
  }

  static getScriptProperties() {
    return MockPropertiesService.scriptProperties;
  }

  static reset() {
    MockPropertiesService.userProperties.deleteAllProperties();
    MockPropertiesService.scriptProperties.deleteAllProperties();
  }
}

// ==========================================
// 6. ScriptApp Mocks
// ==========================================

export class MockTrigger {
  private functionName: string;
  private id: string;

  constructor(fn: string) {
    this.functionName = fn;
    this.id = 'trg_' + Math.random().toString(36).substring(2, 9);
  }

  getHandlerFunction() {
    return this.functionName;
  }

  getUniqueId() {
    return this.id;
  }
}

export class MockTriggerBuilder {
  private functionName: string;

  constructor(fn: string) {
    this.functionName = fn;
  }

  timeBased() {
    return this;
  }

  everyDays(_n: number) {
    return this;
  }

  everyWeeks(_n: number) {
    return this;
  }

  onWeekDay(_day: any) {
    return this;
  }

  atHour(_h: number) {
    return this;
  }

  create() {
    const trigger = new MockTrigger(this.functionName);
    MockScriptApp.addTrigger(trigger);
    return trigger;
  }
}

export class MockScriptApp {
  private static triggers: MockTrigger[] = [];

  static WeekDay = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY'
  };

  static newTrigger(functionName: string) {
    return new MockTriggerBuilder(functionName);
  }

  static getProjectTriggers() {
    return [...MockScriptApp.triggers];
  }

  static deleteTrigger(trigger: MockTrigger) {
    MockScriptApp.triggers = MockScriptApp.triggers.filter(t => t.getUniqueId() !== trigger.getUniqueId());
  }

  static addTrigger(trigger: MockTrigger) {
    MockScriptApp.triggers.push(trigger);
  }

  static reset() {
    MockScriptApp.triggers = [];
  }
}

export class MockUrlFetchApp {
  static requests: Array<{ url: string; params: any }> = [];
  static mockResponse = {
    getResponseCode: () => 200,
    getContentText: () => '{"status":"ok"}'
  };

  static fetch(url: string, params?: any) {
    MockUrlFetchApp.requests.push({ url, params });
    return MockUrlFetchApp.mockResponse;
  }

  static reset() {
    MockUrlFetchApp.requests = [];
    MockUrlFetchApp.mockResponse = {
      getResponseCode: () => 200,
      getContentText: () => '{"status":"ok"}'
    };
  }
}

export class MockUtilities {
  static getUuid() {
    return '12345678-1234-1234-1234-123456789abc';
  }
}

// ==========================================
// Environment Setup & Reset Helpers
// ==========================================

export function setupGasGlobals() {
  (global as any).CardService = MockCardService;
  (global as any).CalendarApp = MockCalendarApp;
  (global as any).SpreadsheetApp = MockSpreadsheetApp;
  (global as any).PropertiesService = MockPropertiesService;
  (global as any).ContentService = MockContentService;
  (global as any).ScriptApp = MockScriptApp;
  (global as any).UrlFetchApp = MockUrlFetchApp;
  (global as any).Utilities = MockUtilities;
}

export function resetGasGlobals() {
  MockCalendarApp.reset();
  MockSpreadsheetApp.reset();
  MockPropertiesService.reset();
  MockScriptApp.reset();
  MockUrlFetchApp.reset();
}
