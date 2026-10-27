import { Link } from '@tanstack/react-router';
import { useConsentStore } from '@/store/consentStore';

const CLOUDFLARE_URL = 'https://www.cloudflare.com/';
const SOURCE_URL = 'https://github.com/ChefMooon/travel-toolkit';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const resetConsent = useConsentStore((s) => s.resetConsent);

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <nav className="site-footer-primary" aria-label="Footer links">
          <Link className="site-footer-link" to="/blog" search={{ tag: undefined }}>
            Blog
          </Link>
          <a
            className="site-footer-link"
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <button
            type="button"
            className="site-footer-link site-footer-button"
            onClick={resetConsent}
          >
            Privacy Preferences
          </button>
        </nav>
        <p className="site-footer-meta">
          <span>&copy; {currentYear} Travel Toolkit</span>
          <span className="site-footer-hosting">
            Hosted on{' '}
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
