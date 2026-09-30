import { useCallback, useRef, useState } from 'react';
import { Grid2X2, Moon, Sun } from 'lucide-react';
import { useTripStore } from '@/store/tripStore';
import Logo from '@/components/Logo';
import GridPanel from '@/components/GridPanel';
import Tooltip from '@/components/Tooltip';

export default function Navbar() {
  const theme = useTripStore((s) => s.theme);
  const setTheme = useTripStore((s) => s.setTheme);
  const [gridOpen, setGridOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeGrid = useCallback(() => {
    setGridOpen(false);
  }, []);

  return (
    <header className="navbar">
      <a className="brand" href="/" aria-label="Go to home page">
        <Logo />
      </a>

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

        <Tooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <div className="toggle-knob">
              <span>{theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}</span>
            </div>
          </button>
        </Tooltip>
      </div>

      <GridPanel open={gridOpen} onClose={closeGrid} triggerRef={triggerRef} />
    </header>
  );
}
