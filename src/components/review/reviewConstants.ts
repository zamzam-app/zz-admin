export type MetricKey = 'staff' | 'speed' | 'clean' | 'quality';

export type OutletAggregate = {
  outletId: string;
  outletName: string;
  managerName: string;
  managerPhone?: string;
  csat: number;
  metrics: Record<MetricKey, number>;
};

export const METRIC_ORDER: MetricKey[] = ['staff', 'speed', 'clean', 'quality'];

export const METRIC_LABEL: Record<MetricKey, string> = {
  staff: 'Staff',
  speed: 'Speed',
  clean: 'Clean',
  quality: 'Quality',
};

export const METRIC_MATCHERS: Record<MetricKey, RegExp> = {
  staff: /(staff|service|team|friendly|attitude)/i,
  speed: /(speed|wait|time|quick|fast)/i,
  clean: /(clean|hygiene|sanitize|sanitation|tidy)/i,
  quality: /(quality|taste|food|fresh|product)/i,
};

export const METRIC_OFFSETS: Record<MetricKey, number> = {
  staff: 0.1,
  speed: -0.15,
  clean: 0.05,
  quality: 0.15,
};

export const scrollableSx = {
  overflowY: 'auto',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

export const cardSx = {
  borderRadius: '22px',
  border: '1px solid #E5E7EB',
  bgcolor: '#FFFFFF',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  overflow: 'hidden' as const,
};
