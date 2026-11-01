/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Plane } from 'lucide-react';
import ToolStamp from './ToolStamp';

describe('ToolStamp', () => {
  it('renders a decorative stamp with icon and postmark', () => {
    const { container } = render(<ToolStamp icon={Plane} size="row" />);
    const wrap = container.querySelector('.stamp-wrap');
    expect(wrap).toHaveAttribute('aria-hidden', 'true');
    expect(wrap).toHaveClass('stamp-wrap--row');
    expect(wrap?.querySelector('.stamp > .stamp-inner > svg')).toBeInTheDocument();
    expect(wrap?.querySelector('svg.postmark')).toBeInTheDocument();
  });
});
