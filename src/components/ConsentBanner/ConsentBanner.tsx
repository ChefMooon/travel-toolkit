import { useConsentStore } from '@/store/consentStore';

export default function ConsentBanner() {
  const consentChoice = useConsentStore((s) => s.consentChoice);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);

  if (consentChoice !== 'unset') {
    return null;
  }

  return (
    <aside className="consent-banner" role="region" aria-label="Cookie consent">
      <div className="consent-banner-copy">
        <p className="consent-banner-title">Cookies and analytics</p>
        <p className="consent-banner-text">
          We use analytics cookies to understand site usage. Analytics stays off until you choose
          to accept.
        </p>
      </div>
      <div className="consent-banner-actions">
        <button type="button" className="consent-btn consent-btn-secondary" onClick={rejectAll}>
          Reject
        </button>
        <button type="button" className="consent-btn consent-btn-primary" onClick={acceptAll}>
          Accept
        </button>
      </div>
    </aside>
  );
}
