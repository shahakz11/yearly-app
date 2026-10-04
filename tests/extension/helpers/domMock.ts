/**
 * Lightweight, zero-dependency DOM and Chrome Extension runtime mock
 * for testing Chrome Extension MV3 content scripts and popup UI in Jest.
 */

export class MockDOMTokenList {
  private classes: Set<string> = new Set();

  constructor(initialClass = '') {
    if (initialClass) {
      initialClass.trim().split(/\s+/).forEach((c) => this.classes.add(c));
    }
  }

  public add(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.add(t));
  }

  public remove(...tokens: string[]): void {
    tokens.forEach((t) => this.classes.delete(t));
  }

  public contains(token: string): boolean {
    return this.classes.has(token);
  }

  public toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.classes.add(token);
      return true;
    } else if (force === false) {
      this.classes.delete(token);
      return false;
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    }
    this.classes.add(token);
    return true;
  }

  public toString(): string {
    return Array.from(this.classes).join(' ');
  }
}

export class MockEvent {
  public type: string;
  public defaultPrevented = false;
  public propagationStopped = false;
  public target: any = null;
  public currentTarget: any = null;
  public key?: string;

  constructor(type: string, init?: { key?: string; bubbles?: boolean }) {
    this.type = type;
    if (init && init.key !== undefined) {
      this.key = init.key;
    }
  }

  public preventDefault(): void {
    this.defaultPrevented = true;
  }

  public stopPropagation(): void {
    this.propagationStopped = true;
  }
}

export class MockElement {
  public tagName: string;
  public id: string = '';
  public attributes: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public classList: MockDOMTokenList;
  public listeners: Record<string, Function[]> = {};

  public type: string = '';
  public checked: boolean = false;
  public value: string = '';
  public rows: number = 2;
  public target: string = '';
  public rel: string = '';
  public title: string = '';

  public style: Record<string, string> = {};

  private _textContent: string = '';

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
    this.classList = new MockDOMTokenList();
    this.style = {};
  }

  get className(): string {
    return this.classList.toString();
  }

  set className(val: string) {
    this.classList = new MockDOMTokenList(val);
  }

  get textContent(): string {
    if (this.children.length === 0) {
      return this._textContent;
    }
    return this.children.map((c) => c.textContent).join(' ') + (this._textContent ? ' ' + this._textContent : '');
  }

  set textContent(val: string) {
    this._textContent = String(val);
  }

  get innerText(): string {
    return this.textContent;
  }

  set innerText(val: string) {
    this.textContent = val;
  }

  get innerHTML(): string {
    return this.textContent;
  }

  set innerHTML(val: string) {
    // Basic parser for simple text/innerHTML assignments
    this.children = [];
    this._textContent = val.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  public setAttribute(name: string, value: string): void {
    const val = String(value);
    this.attributes[name] = val;
    if (name === 'id') this.id = val;
    if (name === 'class') this.className = val;
    if (name === 'title') this.title = val;
    if (name.startsWith('data-')) {
      // Convert data-attr-name to camelCase dataset key
      const camel = name
        .slice(5)
        .replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[camel] = val;
    }
  }

  public getAttribute(name: string): string | null {
    if (name === 'class') return this.className;
    if (name === 'id') return this.id;
    if (name === 'title') return this.title;
    if (name in this.attributes) return this.attributes[name];
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      if (camel in this.dataset) return this.dataset[camel];
    }
    return null;
  }

  public removeAttribute(name: string): void {
    delete this.attributes[name];
    if (name === 'id') this.id = '';
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      delete this.dataset[camel];
    }
  }

  public appendChild(child: MockElement): MockElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  public removeChild(child: MockElement): MockElement {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentNode = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  public addEventListener(type: string, handler: Function): void {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  public removeEventListener(type: string, handler: Function): void {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((h) => h !== handler);
  }

  public dispatchEvent(event: MockEvent): boolean {
    event.target = this;
    event.currentTarget = this;
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) {
      h(event);
      if (event.propagationStopped) break;
    }
    if (!event.propagationStopped && this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }

  public click(): boolean {
    const evt = new MockEvent('click', { bubbles: true });
    return this.dispatchEvent(evt);
  }

  private matchesSelector(selector: string): boolean {
    const trimmed = selector.trim();
    if (!trimmed) return false;

    // Split multiple comma-separated selectors
    if (trimmed.includes(',')) {
      return trimmed.split(',').some((s) => this.matchesSelector(s));
    }

    // Match id
    if (trimmed.startsWith('#')) {
      return this.id === trimmed.slice(1);
    }

    // Match class
    if (trimmed.startsWith('.')) {
      return this.classList.contains(trimmed.slice(1));
    }

    // Match attribute: [attr] or [attr="val"] or tag[attr] or [attr*="val" i]
    const attrMatch = trimmed.match(/^([a-zA-Z0-9_-]*)\[([a-zA-Z0-9_-]+)(?:([*~|^$]?=)(?:"|')?([^"']*)(?:"|')?)?\]\s*(?:\[.*\])?$/);
    if (attrMatch) {
      const tag = attrMatch[1];
      const attrName = attrMatch[2];
      const op = attrMatch[3];
      const expectedVal = attrMatch[4];

      if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) {
        return false;
      }

      const actualVal = this.getAttribute(attrName);
      if (actualVal === null || actualVal === undefined) {
        return false;
      }

      if (!op) return true; // [attr] exists
      if (op === '=') return actualVal === expectedVal;
      if (op === '*=') return actualVal.toLowerCase().includes((expectedVal || '').toLowerCase());
      return true;
    }

    // Match tag name
    if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return this.tagName.toLowerCase() === trimmed.toLowerCase();
    }

    return false;
  }

  public querySelector(selector: string): MockElement | null {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];

    const search = (node: MockElement) => {
      for (const child of node.children) {
        if (child.matchesSelector(selector)) {
          results.push(child);
        }
        search(child);
      }
    };

    search(this);
    return results;
  }
}

export class MockDocument extends MockElement {
  public body: MockElement;
  public readyState: string = 'complete';

  constructor() {
    super('#document');
    this.body = new MockElement('body');
    this.body.parentNode = this;
    this.children.push(this.body);
  }

  public createElement(tagName: string): MockElement {
    return new MockElement(tagName);
  }

  public getElementById(id: string): MockElement | null {
    const search = (node: MockElement): MockElement | null => {
      if (node.id === id) return node;
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };
    return search(this);
  }

  public querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector) || super.querySelector(selector);
  }

  public querySelectorAll(selector: string): MockElement[] {
    return this.body.querySelectorAll(selector);
  }
}

export class MockMutationObserver {
  private callback: (mutations: any[]) => void;
  public target: any = null;
  public options: any = null;

  constructor(callback: (mutations: any[]) => void) {
    this.callback = callback;
  }

  public observe(target: any, options: any): void {
    this.target = target;
    this.options = options;
  }

  public disconnect(): void {
    this.target = null;
  }

  public trigger(mutations: any[]): void {
    this.callback(mutations);
  }
}

export function setupMockEnvironment(): {
  document: MockDocument;
  window: any;
  chrome: any;
  openedUrls: string[];
} {
  const doc = new MockDocument();
  const openedUrls: string[] = [];
  const storageMap: Record<string, any> = {};

  const mockWindow: any = {
    document: doc,
    open: (url: string) => {
      openedUrls.push(url);
      return {};
    },
    addEventListener: doc.addEventListener.bind(doc),
    removeEventListener: doc.removeEventListener.bind(doc)
  };

  const mockChrome: any = {
    storage: {
      local: {
        get: (keys: any, cb: Function) => {
          const res: Record<string, any> = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach((k) => {
            if (storageMap[k] !== undefined) res[k] = storageMap[k];
          });
          if (cb) cb(res);
          return Promise.resolve(res);
        },
        set: (items: Record<string, any>, cb: Function) => {
          Object.assign(storageMap, items);
          if (cb) cb();
          return Promise.resolve();
        },
        clear: (cb: Function) => {
          Object.keys(storageMap).forEach((k) => delete storageMap[k]);
          if (cb) cb();
          return Promise.resolve();
        }
      },
      sync: {
        get: (keys: any, cb: Function) => {
          const res: Record<string, any> = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach((k) => {
            if (storageMap[k] !== undefined) res[k] = storageMap[k];
          });
          if (cb) cb(res);
          return Promise.resolve(res);
        },
        set: (items: Record<string, any>, cb: Function) => {
          Object.assign(storageMap, items);
          if (cb) cb();
          return Promise.resolve();
        },
        clear: (cb: Function) => {
          Object.keys(storageMap).forEach((k) => delete storageMap[k]);
          if (cb) cb();
          return Promise.resolve();
        }
      }
    },
    tabs: {
      create: ({ url }: { url: string }) => {
        openedUrls.push(url);
      }
    },
    runtime: {
      lastError: null
    }
  };

  (global as any).document = doc;
  (global as any).window = mockWindow;
  (global as any).MutationObserver = MockMutationObserver;
  (global as any).chrome = mockChrome;
  (global as any).HTMLElement = MockElement;

  return {
    document: doc,
    window: mockWindow,
    chrome: mockChrome,
    openedUrls
  };
}
