import { useConsentStore } from '@/store/consentStore';

const CLOUDFLARE_URL = 'https://www.cloudflare.com/';
// const SOURCE_URL = 'https://github.com/ChefMooon/mkt';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const resetConsent = useConsentStore((s) => s.resetConsent);

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <p className="site-footer-meta">
          <span>Hosted on</span>
          <a
            className="site-footer-link"
            href={CLOUDFLARE_URL}
            target="_blank"
            rel="noreferrer"
          >
          Cloudflare
          </a>
          {/* <span className="site-footer-separator" aria-hidden="true">|</span>
          <a
            className="site-footer-link"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a> */}
          <span className="site-footer-separator" aria-hidden="true">|</span>
          <button
            type="button"
            className="site-footer-link site-footer-button"
            onClick={resetConsent}
          >
            Privacy Preferences
          </button>
          <span className="site-footer-separator" aria-hidden="true">|</span>
          <span>&copy; {currentYear} Travel Toolkit</span>
        </p>
      </div>
    </footer>
  );
}