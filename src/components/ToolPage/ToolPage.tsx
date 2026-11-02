import type { ReactNode } from 'react';
import ToolPageHeading from '@/components/ToolPageHeading';
import type { ToolRoute } from '@/lib/tools';

interface ToolPageProps {
  route: ToolRoute;
  title: string;
  className?: string;
  children: ReactNode;
}

export default function ToolPage({ route, title, className, children }: ToolPageProps) {
  return (
    <main className={['tool-page', className].filter(Boolean).join(' ')} data-page-entrance aria-label={title}>
      <ToolPageHeading route={route}>{title}</ToolPageHeading>
      {children}
    </main>
  );
}
