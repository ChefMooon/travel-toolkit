import { createFileRoute } from '@tanstack/react-router';
import ForecastTool from '@/features/forecast';

export default function ForecastPage() {
  return <ForecastTool />;
}

export const Route = createFileRoute('/forecast')({
  component: ForecastPage,
});
