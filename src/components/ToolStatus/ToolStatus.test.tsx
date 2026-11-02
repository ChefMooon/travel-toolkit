import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ToolStatus from './ToolStatus';

describe('ToolStatus', () => {
  it('uses role status for info tone', () => {
    render(<ToolStatus>Loading</ToolStatus>);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('tool-status');
    expect(el).not.toHaveClass('tool-status-error');
  });

  it('uses role alert for error tone', () => {
    render(<ToolStatus tone="error">Failed</ToolStatus>);
    expect(screen.getByRole('alert')).toHaveClass('tool-status', 'tool-status-error');
  });

  it('omits the role when live is false', () => {
    render(<ToolStatus live={false}>Empty</ToolStatus>);
    expect(screen.getByText('Empty')).not.toHaveAttribute('role');
  });

  it('passes through id and merges className', () => {
    render(<ToolStatus tone="error" id="x" className="extra">Bad</ToolStatus>);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('id', 'x');
    expect(el).toHaveClass('tool-status', 'tool-status-error', 'extra');
  });
});
