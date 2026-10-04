import { classifyEvent } from './contractOracle';

export interface SimEventChip {
  id: string;
  title: string;
  ariaLabel?: string;
  attributes: Record<string, string>;
  children: SimElement[];
  eventListeners: Record<string, Function[]>;
}

export interface SimElement {
  tagName: string;
  className?: string;
  attributes: Record<string, string>;
  innerText?: string;
  title?: string;
  children: SimElement[];
}

/**
 * Lightweight, hermetic Calendar DOM & Badge Injection Simulator
 * Conforming strictly to PROJECT.md § Interface Contracts #4
 */
export class CalendarDomSimulator {
  public chips: SimEventChip[] = [];

  public addEventChip(id: string, title: string, ariaLabel?: string): SimEventChip {
    const chip: SimEventChip = {
      id,
      title,
      ariaLabel: ariaLabel || title,
      attributes: {
        'data-eventchip': 'true',
        'data-eventid': id,
        role: 'button',
      },
      children: [],
      eventListeners: {},
    };
    this.chips.push(chip);
    return chip;
  }

  /**
   * Simulates the Content Script DOM scan & badge injection loop
   */
  public runBadgeInjectionPass(): {
    scanned: number;
    injected: number;
    skippedAlreadyInjected: number;
    rejectedNonCelebration: number;
  } {
    let injected = 0;
    let skippedAlreadyInjected = 0;
    let rejectedNonCelebration = 0;

    for (const chip of this.chips) {
      // Check idempotency marker
      if (chip.attributes['data-autogifter-injected'] === 'true') {
        skippedAlreadyInjected++;
        continue;
      }

      const titleToClassify = chip.title || chip.ariaLabel || '';
      const classification = classifyEvent(titleToClassify);

      if (classification.isCelebration) {
        // Mark chip as injected
        chip.attributes['data-autogifter-injected'] = 'true';

        // Inject badge element
        const badge: SimElement = {
          tagName: 'span',
          className: 'autogifter-badge',
          title: 'Auto-Gifter: Celebration detected! Click to send gift',
          innerText: '🎁',
          attributes: {
            'data-autogifter-badge': 'true',
          },
          children: [],
        };
        chip.children.push(badge);
        injected++;
      } else {
        rejectedNonCelebration++;
      }
    }

    return {
      scanned: this.chips.length,
      injected,
      skippedAlreadyInjected,
      rejectedNonCelebration,
    };
  }

  public getChipBadge(chipId: string): SimElement | undefined {
    const chip = this.chips.find((c) => c.id === chipId);
    return chip?.children.find((child) => child.className === 'autogifter-badge');
  }

  public simulateBadgeClick(
    chipId: string,
    onModalOpen: (chip: SimEventChip) => void
  ): boolean {
    const chip = this.chips.find((c) => c.id === chipId);
    if (!chip) return false;

    const badge = chip.children.find((child) => child.className === 'autogifter-badge');
    if (!badge) return false;

    // Simulate click event with stopPropagation and open modal
    onModalOpen(chip);
    return true;
  }

  public reset(): void {
    this.chips = [];
  }
}
