import { useCallback, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTripStore } from '@/store/tripStore';
import Logo from '@/components/Logo';
import GridPanel from '@/components/GridPanel';

export default function Navbar() {
  const theme = useTripStore((s) => s.theme);
  const setTheme = useTripStore((s) => s.setTheme);
  const [gridOpen, setGridOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeGrid = useCallback(() => {
    setGridOpen((wasOpen) => {
      if (wasOpen) {
        triggerRef.current?.focus();
      }
      return false;
    });
  }, []);

  return (
    <header className="navbar">
      <div className="brand">
        <Logo />
      </div>

      <div className="navbar-actions">
        <button
          ref={triggerRef}
          type="button"
          className="grid-nav-trigger"
          aria-label={gridOpen ? 'Close tool navigation' : 'Open tool navigation'}
          aria-expanded={gridOpen}
          aria-controls="tool-grid-panel"
          onClick={() => setGridOpen((open) => !open)}
        >
          <img src="/grid.svg" alt="" aria-hidden="true" />
        </button>

        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          <div className="toggle-knob">
            <span>{theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}</span>
          </div>
        </button>
      </div>

      <GridPanel open={gridOpen} onClose={closeGrid} triggerRef={triggerRef} />
    </header>
  );
}
