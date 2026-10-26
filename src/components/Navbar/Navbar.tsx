import { useCallback, useRef, useState } from 'react';
import { Grid2X2 } from 'lucide-react';
import Logo from '@/components/Logo';
import GridPanel from '@/components/GridPanel';
import Tooltip from '@/components/Tooltip';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import { Link } from '@tanstack/react-router';

export default function Navbar() {
  const [gridOpen, setGridOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeGrid = useCallback(() => {
    setGridOpen(false);
  }, []);

  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label="Go to home page">
        <Logo />
      </Link>

      <div className="navbar-actions">
        <Tooltip content={gridOpen ? '' : 'Open tool navigation'}>
          <button
            ref={triggerRef}
            type="button"
            className="grid-nav-trigger"
            aria-label={gridOpen ? 'Close tool navigation' : 'Open tool navigation'}
            aria-expanded={gridOpen}
            aria-controls="tool-grid-panel"
            onClick={() => setGridOpen((open) => !open)}
          >
            <Grid2X2 aria-hidden="true" focusable="false" />
          </button>
        </Tooltip>

        <ThemeSelector />
      </div>

      <GridPanel open={gridOpen} onClose={closeGrid} triggerRef={triggerRef} />
    </header>
  );
}
