import { beforeEach, describe, expect, it } from 'vitest';
import { useConsentStore } from '@/store/consentStore';

describe('consentStore', () => {
  beforeEach(() => {
    localStorage.removeItem('mkt-consent-data');
    useConsentStore.getState().resetConsent();
  });

  it('defaults to unset consent with analytics disabled', () => {
    const state = useConsentStore.getState();
    expect(state.consentChoice).toBe('unset');
    expect(state.analyticsConsent).toBe(false);
  });

  it('acceptAll enables analytics consent', () => {
    useConsentStore.getState().acceptAll();
    const state = useConsentStore.getState();
    expect(state.consentChoice).toBe('accepted');
    expect(state.analyticsConsent).toBe(true);
  });

  it('rejectAll disables analytics consent', () => {
    useConsentStore.getState().acceptAll();
    useConsentStore.getState().rejectAll();
    const state = useConsentStore.getState();
    expect(state.consentChoice).toBe('rejected');
    expect(state.analyticsConsent).toBe(false);
  });

  it('resetConsent returns to default state', () => {
    useConsentStore.getState().acceptAll();
    useConsentStore.getState().resetConsent();
    const state = useConsentStore.getState();
    expect(state.consentChoice).toBe('unset');
    expect(state.analyticsConsent).toBe(false);
  });
});
