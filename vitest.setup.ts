/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import i18n from '@/i18n';

expect.extend(matchers);

// Cleanup after each test
afterEach(async () => {
  cleanup();
  if (i18n.resolvedLanguage !== 'en') {
    await i18n.changeLanguage('en');
  }
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});
