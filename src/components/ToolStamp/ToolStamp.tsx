import type { LucideIcon } from 'lucide-react';

interface ToolStampProps {
  icon: LucideIcon;
  size?: 'card' | 'row' | 'mini';
}

export default function ToolStamp({ icon: Icon, size = 'card' }: ToolStampProps) {
  return (
    <span className={`stamp-wrap stamp-wrap--${size}`} aria-hidden="true">
      <span className="stamp">
        <span className="stamp-inner">
          <Icon focusable="false" strokeWidth={2} />
        </span>
      </span>
      <svg className="postmark" viewBox="0 0 74 34" fill="none" stroke="currentColor" strokeWidth="1.6" focusable="false">
        <circle cx="14" cy="17" r="12.5" />
        <circle cx="14" cy="17" r="8.5" strokeDasharray="1.5 2.5" />
        <path d="M30 9q5-3.5 10 0t10 0t10 0t10 0M30 17q5-3.5 10 0t10 0t10 0t10 0M30 25q5-3.5 10 0t10 0t10 0t10 0" />
      </svg>
    </span>
  );
}
