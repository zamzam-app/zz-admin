import { useMemo } from 'react';
import { Box, Grid, Typography} from '@mui/material';
import { useAuth } from '../lib/context/AuthContext';
import { storesList } from '../__mocks__/managers';
import AggregateRating from '../components/overview/AggregateRating';
import RatingCategory from '../components/overview/RatingCategory';
import AlertBar from '../components/overview/AlertBar';
import StoreCard from '../components/overview/StoreCard';

export default function Overview() {
  const { user } = useAuth();

  // Use mock data
  const stores = storesList;

  const visibleStores = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return stores;
    return stores.filter((s) => user.outletId?.includes(s.outletId) ?? false);
  }, [stores, user]);

  const stats = useMemo(() => {
    const totalFeedback = visibleStores.reduce((acc, s) => acc + s.totalFeedback, 0);

    const avgRating =
      visibleStores.length > 0
        ? (visibleStores.reduce((a, s) => a + s.rating, 0) / visibleStores.length).toFixed(1)
        : '0';

    const categories = Array.from(new Set(visibleStores.map((s) => s.category)));

    const categoryData = categories.map((cat) => {
      const catStores = visibleStores.filter((s) => s.category === cat);
      const avg = catStores.reduce((a, s) => a + s.rating, 0) / catStores.length;

      return { name: cat, rating: Number(avg.toFixed(1)) };
    });

    // Handle empty list case safely
    const sortedStores = [...visibleStores].sort((a, b) => a.rating - b.rating);
    const leastRated = sortedStores.length > 0 ? sortedStores[0] : null;

    return {
      totalFeedback,
      avgRating,
      categoryData,
      leastRated,
    };
  }, [visibleStores]);

  return (
    <Box>
      <Box mb={5} display='flex' justifyContent='space-between' alignItems='center'>
        <div>
          <Typography variant='h4' fontWeight={900} color='#1F2937' letterSpacing='-0.5px'>
            Global Feedback Dashboard
          </Typography>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            Aggregated monitoring across all business units
          </Typography>
        </div>
      </Box>

      {/* Hero Metrics Section */}
      <Grid container spacing={3} mb={5}>
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <AggregateRating avgRating={stats.avgRating} totalFeedback={stats.totalFeedback} />
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 8 }}>
          <RatingCategory />
        </Grid>
      </Grid>

      {/* Needs Attention Section (Admin Only) */}
      {user?.role === 'admin' && stats.leastRated && <AlertBar store={stats.leastRated} />}

      {/* Store List */}
      <Grid container spacing={3}>
        {visibleStores.map((store) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={store.id}>
            <StoreCard store={store} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
