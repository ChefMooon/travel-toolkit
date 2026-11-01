import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Plane } from 'lucide-react';
import { TOOLS } from '@/lib/tools';
import { blogPosts, getBlogPostDisplayDate } from '@/lib/blogPosts';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n';
import ToolStamp from '@/components/ToolStamp';

const toolKeys: Record<string, [TranslationKey, TranslationKey]> = {
  'Trip Cost': ['toolTripCost', 'descriptionTrip'], 'Currency Converter': ['toolCurrency', 'descriptionCurrency'],
  'Timezone Tracker': ['toolTimezone', 'descriptionTimezone'], 'Unit Converter': ['toolUnits', 'descriptionUnits'],
  'Destination Forecast': ['toolForecast', 'descriptionForecast'], 'Travel Countdown': ['toolCountdown', 'descriptionCountdown'],
};

export default function LandingPage() {
  const { t } = useTranslation();
  const latestPost = blogPosts[0];

  return (
    <main className="tool-landing" aria-label={t('toolLauncher')}>
      <span className="hero-map" aria-hidden="true" />
      <header className="tool-landing-header">
        <div className="hero-title">
          <svg className="hero-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M4 100 C 28 112, 62 88, 96 4" />
          </svg>
          <span className="hero-route-dot" aria-hidden="true" />
          <Plane className="hero-route-plane" aria-hidden="true" focusable="false" size={22} strokeWidth={2} />
          <h1>{t('travelToolkit')}</h1>
        </div>
        <p>{t('homeIntro')}</p>
      </header>

      <div className="tool-grid" data-page-entrance>
        {TOOLS.map((tool) => (
          <Link
            key={tool.route}
            to={tool.route}
            className="tool-card"
            data-tool={tool.route.slice(1)}
          >
            <ToolStamp icon={tool.icon} />
            <span className="tool-card-label">{toolKeys[tool.label] ? t(toolKeys[tool.label]![0]) : tool.label}</span>
            <span className="tool-card-desc">{toolKeys[tool.label] ? t(toolKeys[tool.label]![1]) : tool.description}</span>
          </Link>
        ))}
      </div>

      {latestPost && (
        <section className="home-latest-post" aria-labelledby="home-latest-post-title">
          <h2 id="home-latest-post-title">{t('latestFromBlog')}</h2>
          <div className="home-latest-post-row">
            <div className="home-latest-post-meta">
              <Link
                to="/blog/$slug"
                params={{ slug: latestPost.slug }}
                className="home-latest-post-link"
              >
                {latestPost.title}
              </Link>
              <time className="home-latest-post-date" dateTime={latestPost.publishedAt}>
                {getBlogPostDisplayDate(latestPost.publishedAt)}
              </time>
            </div>
            <Link
              to="/blog"
              search={{ tag: undefined }}
              className="home-latest-post-archive"
            >
              {t('viewAllPosts')} <ArrowRight aria-hidden="true" focusable="false" size={16} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export const Route = createFileRoute('/')({
  component: LandingPage,
});
