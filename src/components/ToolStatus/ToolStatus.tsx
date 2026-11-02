import type { ReactNode } from 'react';

interface ToolStatusProps {
  tone?: 'info' | 'error';
  live?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

export default function ToolStatus({ tone = 'info', live = true, id, className, children }: ToolStatusProps) {
  const classes = ['tool-status', tone === 'error' ? 'tool-status-error' : undefined, className].filter(Boolean).join(' ');
  const role = live ? (tone === 'error' ? 'alert' : 'status') : undefined;

  return (
    <p id={id} className={classes} role={role}>
      {children}
    </p>
  );
}
