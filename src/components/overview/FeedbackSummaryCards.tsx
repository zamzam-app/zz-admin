import { Grid } from '@mui/material';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { IncidentSummaryCard, type OutletCount } from './IncidentSummaryCard';

type FeedbackSummaryCardsProps = {
  negativeItems: OutletCount[];
  totalItems: OutletCount[];
  resolvedItems: OutletCount[];
  loading: boolean;
  errorMessage?: string | null;
  periodDescriptor: string;
};

export function FeedbackSummaryCards({
  negativeItems,
  totalItems,
  resolvedItems,
  loading,
  errorMessage,
  periodDescriptor,
}: FeedbackSummaryCardsProps) {
  return (
    <Grid container spacing={3} mb={5}>
      <Grid size={{ xs: 12, md: 4 }}>
        <IncidentSummaryCard
          icon={<AlertCircle size={20} />}
          title='Total Negative Feedbacks'
          description={`Negative feedbacks recorded ${periodDescriptor}.`}
          items={negativeItems}
          loading={loading}
          errorMessage={errorMessage}
          background='linear-gradient(180deg, #FFF5F7 0%, #FFF1F2 100%)'
          borderColor='#FECDD3'
          accentColor='#E11D48'
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <IncidentSummaryCard
          icon={<AlertTriangle size={20} />}
          title='Total Feedback Received'
          description={`All feedback recorded ${periodDescriptor}.`}
          items={totalItems}
          loading={loading}
          errorMessage={errorMessage}
          background='linear-gradient(180deg, #FFF9F0 0%, #FFF7ED 100%)'
          borderColor='#FED7AA'
          accentColor='#EA580C'
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <IncidentSummaryCard
          icon={<CheckCircle2 size={20} />}
          title='Total Feedbacks Resolved'
          description={`Resolved feedbacks ${periodDescriptor}.`}
          items={resolvedItems}
          loading={loading}
          errorMessage={errorMessage}
          background='linear-gradient(180deg, #F3FFF8 0%, #ECFDF5 100%)'
          borderColor='#BBF7D0'
          accentColor='#16A34A'
        />
      </Grid>
    </Grid>
  );
}
