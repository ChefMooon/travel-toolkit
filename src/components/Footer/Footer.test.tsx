/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';
import { useConsentStore } from '@/store/consentStore';

describe('Footer', () => {
  beforeEach(() => {
    useConsentStore.getState().resetConsent();
  });

  it('shows privacy preferences control', () => {
    render(<Footer />);

    expect(screen.getByRole('button', { name: 'Privacy Preferences' })).toBeInTheDocument();
  });

  it('shows the source repository link', () => {
    render(<Footer />);

    const sourceLink = screen.getByRole('link', { name: 'Source' });

    expect(sourceLink).toHaveAttribute('href', 'https://github.com/ChefMooon/mkt');
    expect(sourceLink).toHaveAttribute('target', '_blank');
    expect(sourceLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('resets consent state when privacy preferences is clicked', () => {
    useConsentStore.getState().acceptAll();
    expect(useConsentStore.getState().consentChoice).toBe('accepted');

    render(<Footer />);

    fireEvent.click(screen.getByRole('button', { name: 'Privacy Preferences' }));

    expect(useConsentStore.getState().consentChoice).toBe('unset');
    expect(useConsentStore.getState().analyticsConsent).toBe(false);
  });
});
