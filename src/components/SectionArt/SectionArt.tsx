import type { CSSProperties, ReactNode } from 'react';

// Decorative trip-page art in the ToolStamp postal style. Colours come only from
// currentColor and the per-tool --card-* variables so both themes work. Each svg
// carries data-tool="trip" so those variables resolve on the art itself without
// scoping the whole page.
export interface SectionArtProps {
  className?: string;
}

const INK: CSSProperties = { stroke: 'var(--card-icon, currentColor)' };
const EDGE: CSSProperties = { stroke: 'var(--card-edge, currentColor)' };
const MUTED: CSSProperties = { stroke: 'var(--text-3, currentColor)' };
const PAPER: CSSProperties = { fill: 'var(--card-icon-bg, none)' };
const CARD: CSSProperties = { ...EDGE, ...PAPER };

const MARK_SIZE = 22;
const MARK_STROKE = 1.7;
const EMPTY_SIZE = 64;
const EMPTY_STROKE = 2;

interface ArtProps extends SectionArtProps {
  kind: string;
  viewBox: string;
  size: number | string;
  strokeWidth: number;
  style?: CSSProperties;
  children: ReactNode;
}

function Art({ kind, viewBox, size, strokeWidth, className, style, children }: ArtProps) {
  return (
    <svg
      className={['section-art', `section-art--${kind}`, className].filter(Boolean).join(' ')}
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      data-tool="trip"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* Header marks: 24x24 viewBox, shown at ~20-24px. */

export function PartyMark({ className }: SectionArtProps) {
  return (
    <Art kind="party-mark" viewBox="0 0 24 24" size={MARK_SIZE} strokeWidth={MARK_STROKE} className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" style={CARD} />
      <path d="M16.5 7.5v9" strokeDasharray="1.2 2" style={EDGE} />
      <g style={INK}>
        <circle cx="6.5" cy="10" r="1.5" />
        <path d="M4.1 16a2.4 2.4 0 0 1 4.8 0" />
        <circle cx="12" cy="10" r="1.5" />
        <path d="M9.6 16a2.4 2.4 0 0 1 4.8 0" />
      </g>
      <circle cx="19.3" cy="12" r="1.3" style={EDGE} />
    </Art>
  );
}

export function LedgerMark({ className }: SectionArtProps) {
  return (
    <Art kind="ledger-mark" viewBox="0 0 24 24" size={MARK_SIZE} strokeWidth={MARK_STROKE} className={className}>
      <path d="M5 3h14v18l-2.33-1.5-2.33 1.5-2.34-1.5L9.67 21l-2.34-1.5L5 21z" style={CARD} />
      <path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h2.5" style={INK} />
      <circle cx="15" cy="15.5" r="2.3" style={EDGE} />
    </Art>
  );
}

export function SummaryMark({ className }: SectionArtProps) {
  return (
    <Art kind="summary-mark" viewBox="0 0 24 24" size={MARK_SIZE} strokeWidth={MARK_STROKE} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" style={CARD} />
      <path d="M6 8q1.5-1.3 3 0t3 0t3 0t3 0" style={EDGE} />
      <path d="M8 17.5v-4M12 17.5v-6M16 17.5v-3" style={INK} />
    </Art>
  );
}

/* Empty-state illustrations: 72x72 viewBox, shown at ~56-72px. */

export function PartyEmptyArt({ className }: SectionArtProps) {
  return (
    <Art kind="party-empty" viewBox="0 0 72 72" size={EMPTY_SIZE} strokeWidth={EMPTY_STROKE} className={className}>
      <rect x="6" y="22" width="52" height="34" rx="4" style={CARD} />
      <path d="M44 26v26" strokeDasharray="2 3" style={EDGE} />
      {/* Dashed passenger outline: nobody has boarded yet. */}
      <g strokeDasharray="3 3" style={MUTED}>
        <circle cx="24" cy="33" r="5" />
        <path d="M13 51a11 11 0 0 1 22 0" />
      </g>
      <path d="M51 35v8M47 39h8" style={INK} />
    </Art>
  );
}

export function LedgerEmptyArt({ className }: SectionArtProps) {
  return (
    <Art kind="ledger-empty" viewBox="0 0 72 72" size={EMPTY_SIZE} strokeWidth={EMPTY_STROKE} className={className}>
      <path
        d="M18 10h36v48l-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3-4.5 3z"
        style={CARD}
      />
      <path d="M18 20h36" strokeDasharray="2 3" style={EDGE} />
      <path d="M25 28h22M25 35h22M25 42h11" strokeDasharray="3 3" style={MUTED} />
      <g transform="rotate(-12 47 45)" opacity="0.75" style={EDGE}>
        <circle cx="47" cy="45" r="8" />
        <circle cx="47" cy="45" r="5" strokeDasharray="1.5 2.5" />
      </g>
    </Art>
  );
}

export function SummaryEmptyArt({ className }: SectionArtProps) {
  return (
    <Art kind="summary-empty" viewBox="0 0 72 72" size={EMPTY_SIZE} strokeWidth={EMPTY_STROKE} className={className}>
      {/* Dotted outer edge reads as stamp perforations. */}
      <rect x="10" y="14" width="44" height="46" rx="2" strokeWidth="3" strokeDasharray="0 4.5" style={CARD} />
      <rect x="15" y="19" width="34" height="36" rx="1.5" strokeWidth="1.6" style={EDGE} />
      <g style={MUTED}>
        <rect x="21" y="38" width="5" height="11" rx="1" />
        <rect x="29.5" y="31" width="5" height="18" rx="1" />
        <rect x="38" y="35" width="5" height="14" rx="1" />
      </g>
      <path d="M19 49h26" style={INK} />
    </Art>
  );
}

/* Inline glyph sized to the surrounding text (replaces the baby emoji). */

export function ChildMark({ className }: SectionArtProps) {
  return (
    <Art
      kind="child"
      viewBox="0 0 16 16"
      size="1em"
      strokeWidth={1.6}
      className={className}
    >
      <circle cx="8" cy="5.2" r="2.6" />
      <path d="M4.2 14v-1a3.8 3.8 0 0 1 7.6 0v1" />
    </Art>
  );
}
