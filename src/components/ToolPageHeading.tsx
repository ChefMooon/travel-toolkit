import type { ReactNode } from 'react';
import ToolStamp from '@/components/ToolStamp';
import { TOOLS, type ToolRoute } from '@/lib/tools';

interface ToolPageHeadingProps {
  route: ToolRoute;
  children: ReactNode;
}

export default function ToolPageHeading({ route, children }: ToolPageHeadingProps) {
  const tool = TOOLS.find((item) => item.route === route);
  if (!tool) return <h1>{children}</h1>;
  const toolName = route.slice(1);

  return (
    <h1 className="tool-page-heading" data-tool={toolName}>
      <ToolStamp icon={tool.icon} size="card" />
      <span className="tool-page-heading-title">{children}</span>
    </h1>
  );
}
