import { useNavigate } from '@tanstack/react-router';
import { TOOLS } from '@/lib/tools';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="tool-landing" aria-label="Tool launcher">
      <header className="tool-landing-header">
        <h1>Travel Toolkit</h1>
        <p>Pick a tool to plan costs, compare time, and prep your trip details.</p>
      </header>

      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.route}
            type="button"
            className="tool-card"
            onClick={() => navigate({ to: tool.route })}
          >
            <img src={tool.icon} alt="" aria-hidden="true" />
            <span className="tool-card-label">{tool.label}</span>
            <span className="tool-card-desc">{tool.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
