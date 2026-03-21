export type ToolRoute = '/trip' | '/currency' | '/timezone' | '/forecast';

export type Tool = {
  route: ToolRoute;
  label: string;
  description: string;
  icon: string;
};

export const TOOLS: Tool[] = [
  {
    route: '/trip',
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    icon: '/trip-cost.svg',
  },
  {
    route: '/currency',
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    icon: '/currency.svg',
  },
  {
    route: '/timezone',
    label: 'Timezone Converter',
    description: 'Compare times across destinations.',
    icon: '/timezone.svg',
  },
  {
    route: '/forecast',
    label: 'Destination Forecast',
    description: 'Check weather forecasts before travel.',
    icon: '/forecast.svg',
  },
];
