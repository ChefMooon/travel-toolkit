import {
  ArrowLeftRight,
  Calculator,
  CloudSun,
  Clock,
  Ruler,
  type LucideIcon,
} from 'lucide-react';

export type ToolRoute = '/trip' | '/currency' | '/timezone' | '/forecast' | '/units';

export type Tool = {
  route: ToolRoute;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const TOOLS: Tool[] = [
  {
    route: '/trip',
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    icon: Calculator,
  },
  {
    route: '/currency',
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    icon: ArrowLeftRight,
  },
  {
    route: '/timezone',
    label: 'Timezone Tracker',
    description: 'Save and track timezones for different locations.',
    icon: Clock,
  },
  {
    route: '/units',
    label: 'Unit Converter',
    description: 'Convert travel measurements in a few clicks.',
    icon: Ruler,
  },
  {
    route: '/forecast',
    label: 'Destination Forecast',
    description: 'Check weather and event forecasts before travel.',
    icon: CloudSun,
  },
];
