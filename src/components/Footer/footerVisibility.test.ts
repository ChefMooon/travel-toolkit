/// <reference types="vitest" />

import { describe, expect, it } from 'vitest';
import { NON_DESKTOP_MAX_WIDTH, shouldShowFooter } from './footerVisibility';

describe('footer visibility', () => {
  it('shows the footer on non-trip routes across viewport sizes', () => {
    expect(shouldShowFooter('/', 390)).toBe(true);
    expect(shouldShowFooter('/currency', 600)).toBe(true);
    expect(shouldShowFooter('/forecast', 1280)).toBe(true);
  });

  it('hides the footer on trip route non-desktop viewports', () => {
    expect(shouldShowFooter('/trip', 390)).toBe(false);
    expect(shouldShowFooter('/trip', NON_DESKTOP_MAX_WIDTH)).toBe(false);
    expect(shouldShowFooter('/trip/details', 600)).toBe(false);
  });

  it('shows the footer on trip route desktop viewports', () => {
    expect(shouldShowFooter('/trip', NON_DESKTOP_MAX_WIDTH + 1)).toBe(true);
  });
});