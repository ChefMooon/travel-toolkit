const CLOUDFLARE_URL = 'https://www.cloudflare.com/';
// const SOURCE_URL = 'https://github.com/ChefMooon/mkt';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
          <span>&copy; {currentYear} Travel Toolkit</span>
        </p>
      </div>
    </footer>
  );
}