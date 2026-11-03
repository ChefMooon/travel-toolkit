import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';

export interface InlineEditableTextHandle {
  /** Swaps the text for its input and focuses it (e.g. from a "Rename" menu item). */
  startEditing: () => void;
}

interface InlineEditableTextProps {
  value: string;
  /** Shown (not committed) when the value is empty. */
  placeholder?: string;
  /** Called once per edit with the trimmed, non-empty, changed text. */
  onCommit: (next: string) => void;
  maxLength: number;
  /** Accessible name of the input while editing. */
  'aria-label': string;
  /** Extra description for the view button, e.g. "Activate to rename". */
  'aria-describedby'?: string;
  /** Size variant; the view button and the input share it so swapping never shifts layout. */
  className?: string;
  disabled?: boolean;
  ref?: Ref<InlineEditableTextHandle>;
}

/**
 * A button showing the text that swaps to an input with the same box and font metrics.
 * Enter or blur commits, Escape cancels; after Enter/Escape focus returns to the button.
 */
export default function InlineEditableText({
  value,
  placeholder,
  onCommit,
  maxLength,
  className,
  disabled = false,
  ref,
  ...aria
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const viewRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Enter commits and unmounts the input, which then fires blur: this keeps it to one commit.
  const settledRef = useRef(true);
  const refocusViewRef = useRef(false);

  const start = () => {
    if (disabled) return;
    settledRef.current = false;
    setDraft(value);
    setEditing(true);
  };

  useImperativeHandle(ref, () => ({ startEditing: start }));

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }
    if (refocusViewRef.current) {
      refocusViewRef.current = false;
      viewRef.current?.focus();
    }
  }, [editing]);

  const finish = (commit: boolean, refocus: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    refocusViewRef.current = refocus;
    setEditing(false);
    const next = draft.trim();
    // Empty or unchanged text restores the old value.
    if (commit && next && next !== value) onCommit(next);
  };

  const classes = ['inline-edit', className].filter(Boolean).join(' ');

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`${classes} inline-edit-input`}
        value={draft}
        maxLength={maxLength}
        aria-label={aria['aria-label']}
        dir="auto"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => finish(true, false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            finish(true, true);
          } else if (event.key === 'Escape') {
            // Cancel the edit only; the surrounding dialog stays open.
            event.preventDefault();
            event.stopPropagation();
            finish(false, true);
          }
        }}
      />
    );
  }

  return (
    <button
      ref={viewRef}
      type="button"
      className={`${classes} inline-edit-view`}
      aria-describedby={aria['aria-describedby']}
      aria-disabled={disabled || undefined}
      onClick={start}
    >
      <bdi dir="auto">{value || placeholder}</bdi>
    </button>
  );
}
