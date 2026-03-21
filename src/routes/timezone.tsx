import { createFileRoute } from '@tanstack/react-router';
import TimezoneTool from '@/features/timezone/TimezoneTool';

export default function TimezonePage() {
  return <TimezoneTool />;
}

export const Route = createFileRoute('/timezone')({
  component: TimezonePage,
});
