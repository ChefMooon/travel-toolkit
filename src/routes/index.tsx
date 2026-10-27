import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '@/lib/tools';
import { blogPosts, getBlogPostDisplayDate } from '@/lib/blogPosts';

export default function LandingPage() {
  const latestPost = blogPosts[0];

  return (
    <main className="tool-landing" aria-label="Tool launcher">
      <header className="tool-landing-header">
        <h1>Travel Toolkit</h1>
        <p>Calculate trip costs and find the details you need to plan with confidence.</p>
        <Link to="/trip" className="tool-landing-cta">
          Calculate trip cost <ArrowRight aria-hidden="true" focusable="false" size={18} strokeWidth={2.5} />
        </Link>
      </header>

      <div className="tool-grid" data-page-entrance>
        {TOOLS.map((tool) => (
          <Link
            key={tool.route}
            to={tool.route}
            className={`tool-card tool-card--${tool.route.slice(1)}`}
          >
            <span className="tool-launcher-icon" aria-hidden="true">
              <tool.icon focusable="false" strokeWidth={2} />
            </span>
            <span className="tool-card-label">{tool.label}</span>
            <span className="tool-card-desc">{tool.description}</span>
          </Link>
        ))}
      </div>

      {latestPost && (
        <section className="home-latest-post" aria-labelledby="home-latest-post-title">
          <h2 id="home-latest-post-title">Latest from the blog</h2>
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
              View all posts <ArrowRight aria-hidden="true" focusable="false" size={16} />
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
