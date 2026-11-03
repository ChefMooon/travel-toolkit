/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlineEditableText, { type InlineEditableTextHandle } from './InlineEditableText';

function setup(props: Partial<React.ComponentProps<typeof InlineEditableText>> = {}) {
  const onCommit = vi.fn();
  const onParentKeyDown = vi.fn();
  const ref = createRef<InlineEditableTextHandle>();
  render(
    <div onKeyDown={onParentKeyDown}>
      <InlineEditableText ref={ref} value="Kyoto" onCommit={onCommit} maxLength={12} aria-label="Trip name" className="extra" {...props} />
    </div>
  );
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Kyoto' }));
  return { onCommit, onParentKeyDown, ref, open };
}

describe('InlineEditableText', () => {
  it('swaps the button for a focused, selected input that shares its classes and limits', () => {
    const { open } = setup();
    expect(screen.getByRole('button', { name: 'Kyoto' })).toHaveClass('inline-edit', 'extra', 'inline-edit-view');
    open();

    const input = screen.getByRole('textbox', { name: 'Trip name' });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Kyoto');
    expect(input).toHaveAttribute('maxLength', '12');
    expect(input).toHaveClass('inline-edit', 'extra', 'inline-edit-input');
    expect((input as HTMLInputElement).selectionStart).toBe(0);
    expect((input as HTMLInputElement).selectionEnd).toBe(5);
  });

  it('commits once on Enter (the following blur does not commit again) and refocuses the button', () => {
    const { onCommit, open } = setup();
    open();
    const input = screen.getByRole('textbox', { name: 'Trip name' });
    fireEvent.change(input, { target: { value: '  Osaka  ' } });

    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('Osaka');
    expect(screen.getByRole('button', { name: 'Kyoto' })).toHaveFocus();
  });

  it('commits on blur without moving focus back', () => {
    const { onCommit, open } = setup();
    open();
    const input = screen.getByRole('textbox', { name: 'Trip name' });
    fireEvent.change(input, { target: { value: 'Nara' } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith('Nara');
    expect(screen.getByRole('button', { name: 'Kyoto' })).not.toHaveFocus();
  });

  it('cancels on Escape without letting the dialog see the key, and refocuses the button', () => {
    const { onCommit, onParentKeyDown, open } = setup();
    open();
    const input = screen.getByRole('textbox', { name: 'Trip name' });
    fireEvent.change(input, { target: { value: 'Nara' } });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCommit).not.toHaveBeenCalled();
    expect(onParentKeyDown).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Kyoto' })).toHaveFocus();
  });

  it.each([['empty', '   '], ['unchanged', ' Kyoto ']])('restores the old value for %s text without committing', (_case, value) => {
    const { onCommit, open } = setup();
    open();
    const input = screen.getByRole('textbox', { name: 'Trip name' });
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Kyoto' })).toBeInTheDocument();
  });

  it('starts editing through its handle and shows the placeholder for an empty value', () => {
    const { ref } = setup({ value: '', placeholder: 'Untitled' });
    expect(screen.getByRole('button', { name: 'Untitled' })).toBeInTheDocument();

    act(() => ref.current?.startEditing());

    expect(screen.getByRole('textbox', { name: 'Trip name' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Trip name' })).toHaveValue('');
  });

  it('wraps the shown text in an auto-direction bdi', () => {
    setup({ value: 'رحلة' });
    expect(screen.getByRole('button', { name: 'رحلة' }).querySelector('bdi')).toHaveAttribute('dir', 'auto');
  });
});
