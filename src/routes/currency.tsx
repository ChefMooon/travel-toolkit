import { createFileRoute } from '@tanstack/react-router';
import CurrencyTool from '@/features/currency/CurrencyTool';

export default function CurrencyPage() {
  return <CurrencyTool />;
}

export const Route = createFileRoute('/currency')({
  component: CurrencyPage,
});
