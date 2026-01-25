import { useMemo, useState } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Star } from 'lucide-react';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { REVIEWS } from '../__mocks__/reviewsData';
import { useAuth } from '../lib/context/AuthContext';

export default function Reviews() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');

  /* ============================
     Filter logic
  ============================ */
  const filteredReviews = useMemo(() => {
    // If we have no user, shouldn't really happen if protected, but safe fallback
    if (!user) return [];

    let reviewsToFilter = REVIEWS;

    // 1. Filter by User's assigned outlets (if not admin/all)
    // Assuming 'admin' role sees all, or if outletId is missing/empty they see nothing or all?
    // Let's assume if role is NOT admin, we restrict.
    if (user.role !== 'admin' && user.outletId && user.outletId.length > 0) {
      reviewsToFilter = REVIEWS.filter((r) => user.outletId?.includes(r.outletId));
    }

    // 2. Filter by dropdown selection
    if (selectedOutlet === 'all') {
      return reviewsToFilter;
    }

    return reviewsToFilter.filter((r) => r.outletId === selectedOutlet);
  }, [selectedOutlet, user]);

  const outlets = useMemo(() => {
    // Get unique outlets from reviews, but maybe restrict this list based on user permissions too?
    // For now, let's show all outlets available in the filtered set (or all globally if admin)

    // Actually, the dropdown options should probably only reflect what the user CAN see.
    // So let's base options on the initial filtered set (before dropdown filter).

    let baseReviews = REVIEWS;
    if (user?.role !== 'admin' && user?.outletId) {
      baseReviews = REVIEWS.filter((r) => user.outletId?.includes(r.outletId));
    }

    const uniqueOutlets = Array.from(
      new Map(baseReviews.map((r) => [r.outletId, r.outletName])).entries(),
    );
    return uniqueOutlets;
  }, [user]);

  return (
    <Box>
      {/* Header */}
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
        mb={4}
      >
        <Box>
          <Typography variant='h4' fontWeight={800} color='#1F2937'>
            Reviews
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Customer feedback across outlets
          </Typography>
        </Box>

        {/* Filter - show for everyone, but options are limited for staff. 
            Or show only for Admin if staff can't see individual outlet breakdown? 
            Original request: "ADMIN Filter". 
            But given staff might have multiple outlets, maybe they want to filter too?
            Let's stick to showing it if there's more than 1 outlet to choose from.
        */}
        {(user?.role === 'admin' || (user?.outletId && user.outletId.length > 1)) && (
          <Box width={{ xs: '100%', sm: 280 }}>
            <Select
              label='Filter by Outlet'
              options={[
                { label: 'All Outlets', value: 'all' },
                ...outlets.map(([id, name]) => ({ label: name || id, value: id })),
              ]}
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
            />
          </Box>
        )}
      </Box>

      {/* Review List */}
      <Stack spacing={3}>
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <Box display='flex' justifyContent='space-between' mb={2}>
              <Box>
                <Typography fontWeight={700} color='#1F2937'>
                  {review.customer}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {review.outletName} • {review.date}
                </Typography>
              </Box>

              <Chip
                icon={<Star size={14} />}
                label={review.rating}
                sx={{
                  bgcolor: '#F5E6CA',
                  color: '#1F2937',
                  fontWeight: 700,
                }}
              />
            </Box>

            <Typography color='text.secondary'>{review.comment}</Typography>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Typography textAlign='center' color='text.secondary'>
            No reviews found
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
