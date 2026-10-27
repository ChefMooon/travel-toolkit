import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '@/lib/tools';

export default function LandingPage() {
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
    </main>
  );
}

export const Route = createFileRoute('/')({
  component: LandingPage,
});
