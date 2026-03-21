import { createFileRoute } from '@tanstack/react-router';
import App from '@/App';
import TripToolbar from '@/components/TripToolbar';

export default function TripCostPage() {
  return (
    <>
      <TripToolbar />
      <App />
    </>
  );
}

export const Route = createFileRoute('/trip')({
  component: TripCostPage,
});
