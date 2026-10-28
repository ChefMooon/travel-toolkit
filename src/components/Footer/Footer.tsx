import { Link } from '@tanstack/react-router';
import { useConsentStore } from '@/store/consentStore';
import { useTranslation } from 'react-i18next';

const CLOUDFLARE_URL = 'https://www.cloudflare.com/';
const SOURCE_URL = 'https://github.com/ChefMooon/travel-toolkit';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const resetConsent = useConsentStore((s) => s.resetConsent);

  return (
    <footer className="site-footer" aria-label={t('siteFooter')}>
      <div className="site-footer-inner">
        <nav className="site-footer-primary" aria-label={t('footerLinks')}>
          <Link className="site-footer-link" to="/blog" search={{ tag: undefined }}>
            {t('blog')}
          </Link>
          <a
            className="site-footer-link"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('sourceCode')}
          </a>
          <button
            type="button"
            className="site-footer-link site-footer-button"
            onClick={resetConsent}
          >
            {t('privacyPreferences')}
          </button>
        </nav>
        <p className="site-footer-meta">
          <span>&copy; {currentYear} Travel Toolkit</span>
          <span className="site-footer-hosting">
            {t('hostedOn')}{' '}
            <a
              className="site-footer-link site-footer-meta-link"
              href={CLOUDFLARE_URL}
              target="_blank"
              rel="noreferrer"
            >
              Cloudflare
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
