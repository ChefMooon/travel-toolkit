/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ChildMark,
  LedgerEmptyArt,
  LedgerMark,
  PartyEmptyArt,
  PartyMark,
  SummaryEmptyArt,
  SummaryMark,
  type SectionArtProps,
} from '.';

const ART: Array<[string, ComponentType<SectionArtProps>]> = [
  ['PartyMark', PartyMark],
  ['LedgerMark', LedgerMark],
  ['SummaryMark', SummaryMark],
  ['PartyEmptyArt', PartyEmptyArt],
  ['LedgerEmptyArt', LedgerEmptyArt],
  ['SummaryEmptyArt', SummaryEmptyArt],
  ['ChildMark', ChildMark],
];

describe('SectionArt', () => {
  it.each(ART)('%s renders a decorative svg', (_name, Art) => {
    const { container } = render(<Art className="extra" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveClass('section-art', 'extra');
  });

  it('uses no literal colours, only currentColor and CSS variables', async () => {
    // The app tsconfig has no node types, so load fs dynamically.
    const nodeFs = 'node:fs';
    const { readFileSync } = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync: (path: string, encoding: string) => string };
    const source = readFileSync('src/components/SectionArt/SectionArt.tsx', 'utf8');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
