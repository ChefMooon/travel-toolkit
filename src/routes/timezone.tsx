import { createFileRoute } from '@tanstack/react-router';
import TimezonePage from '../features/timezone/TimezonePage';

export const Route = createFileRoute('/timezone')({
  component: () => <TimezonePage />,
});
