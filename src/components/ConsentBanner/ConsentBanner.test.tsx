/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ConsentBanner from '@/components/ConsentBanner';
import { useConsentStore } from '@/store/consentStore';

describe('ConsentBanner', () => {
  beforeEach(() => {
    useConsentStore.getState().resetConsent();
  });

  it('renders cookie consent choices while consent is unset', () => {
    render(<ConsentBanner />);

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
  });

  it('records rejected consent and hides the banner', () => {
    render(<ConsentBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(useConsentStore.getState().consentChoice).toBe('rejected');
    expect(useConsentStore.getState().analyticsConsent).toBe(false);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });

  it('records accepted consent and hides the banner', () => {
    render(<ConsentBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(useConsentStore.getState().consentChoice).toBe('accepted');
    expect(useConsentStore.getState().analyticsConsent).toBe(true);
    expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
  });
});
