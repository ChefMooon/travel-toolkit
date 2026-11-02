import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ToolPage from './ToolPage';

describe('ToolPage', () => {
  it('renders a labelled main landmark with entrance attribute', () => {
    render(<ToolPage route="/units" title="Units"><p>body</p></ToolPage>);
    const main = screen.getByRole('main', { name: 'Units' });
    expect(main).toHaveAttribute('data-page-entrance');
    expect(main).toHaveClass('tool-page');
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('merges a custom className', () => {
    render(<ToolPage route="/countdown" title="Countdown" className="countdown-page">x</ToolPage>);
    expect(screen.getByRole('main')).toHaveClass('tool-page', 'countdown-page');
  });

  it('renders the tool heading', () => {
    render(<ToolPage route="/currency" title="Currency">x</ToolPage>);
    const heading = screen.getByRole('heading', { level: 1, name: 'Currency' });
    expect(heading).toHaveClass('tool-page-heading');
    expect(heading).toHaveAttribute('data-tool', 'currency');
  });
});
