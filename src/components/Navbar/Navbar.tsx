import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid2X2 } from 'lucide-react';
import Logo from '@/components/Logo';
import GridPanel from '@/components/GridPanel';
import Tooltip from '@/components/Tooltip';
import { Link } from '@tanstack/react-router';
import SettingsMenu from '@/components/SettingsMenu/SettingsMenu';

export default function Navbar() {
  const { t } = useTranslation();
  const [gridOpen, setGridOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeGrid = useCallback(() => {
    setGridOpen(false);
  }, []);

  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label={t('goHome')}>
        <Logo />
      </Link>

      <div className="navbar-actions">
        <Tooltip content={gridOpen ? '' : t('openToolNavigation')}>
          <button
            ref={triggerRef}
            type="button"
            className="grid-nav-trigger"
            aria-label={gridOpen ? t('closeToolNavigation') : t('openToolNavigation')}
            aria-expanded={gridOpen}
            aria-controls="tool-grid-panel"
            onClick={() => setGridOpen((open) => !open)}
          >
            <Grid2X2 aria-hidden="true" focusable="false" />
          </button>
        </Tooltip>

        <SettingsMenu />
      </div>

      <GridPanel open={gridOpen} onClose={closeGrid} triggerRef={triggerRef} />
    </header>
  );
}
