import { createFileRoute, Link } from '@tanstack/react-router';
import { TOOLS } from '@/lib/tools';

export default function LandingPage() {
  return (
    <main className="tool-landing" aria-label="Tool launcher">
      <header className="tool-landing-header">
        <h1>Travel Toolkit</h1>
        <p>Pick a tool to plan costs, compare time, and prep your trip details.</p>
      </header>

      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <Link
            key={tool.route}
            to={tool.route}
            className="tool-card"
          >
            <span className="tool-launcher-icon" aria-hidden="true">
              <tool.icon focusable="false" strokeWidth={1.75} />
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
