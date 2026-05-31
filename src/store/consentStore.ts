import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConsentChoice = 'unset' | 'accepted' | 'rejected';

interface ConsentStore {
  consentChoice: ConsentChoice;
  analyticsConsent: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set) => ({
      consentChoice: 'unset',
      analyticsConsent: false,
      acceptAll: () => set({ consentChoice: 'accepted', analyticsConsent: true }),
      rejectAll: () => set({ consentChoice: 'rejected', analyticsConsent: false }),
      resetConsent: () => set({ consentChoice: 'unset', analyticsConsent: false }),
    }),
    {
      name: 'travel-toolkit-consent-data',
    },
  ),
);
