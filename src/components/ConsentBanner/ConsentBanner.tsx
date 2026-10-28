import { useConsentStore } from '@/store/consentStore';
import { useTranslation } from 'react-i18next';

export default function ConsentBanner() {
  const { t } = useTranslation();
  const consentChoice = useConsentStore((s) => s.consentChoice);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);

  if (consentChoice !== 'unset') {
    return null;
  }

  return (
    <aside className="consent-banner" role="region" aria-label={t('cookieConsent')}>
      <div className="consent-banner-copy">
        <p className="consent-banner-title">{t('cookiesAnalytics')}</p>
        <p className="consent-banner-text">
          {t('analyticsConsentCopy')}
        </p>
      </div>
      <div className="consent-banner-actions">
        <button type="button" className="consent-btn consent-btn-secondary" onClick={rejectAll}>
          {t('reject')}
        </button>
        <button type="button" className="consent-btn consent-btn-primary" onClick={acceptAll}>
          {t('accept')}
        </button>
      </div>
    </aside>
  );
}
