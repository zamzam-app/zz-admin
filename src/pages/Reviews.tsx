import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Star } from 'lucide-react';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import type { ApiReview } from '../lib/types/review';

interface Review {
  id: string;
  customer: string;
  outletId: string;
  outletName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ReviewsDemo() {
  const { user } = useAuth();
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  /*  LOAD API DATA  */
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data: ApiReview[] = await reviewsApi.getAll();

        const mapped: Review[] = data.map((r) => {
          const questionMap = new Map(r.formId?.questions?.map((q) => [q._id, q.type]) ?? []);

          let customerName = 'Anonymous';
          let commentText = '';

          for (const res of r.response ?? []) {
            const questionType = questionMap.get(res.questionId);
            const answer = res.answer;

            if (questionType === 'short_answer') {
              customerName = Array.isArray(answer)
                ? (answer[0]?.toString() ?? 'Anonymous')
                : (answer?.toString() ?? 'Anonymous');
            }

            if (questionType === 'paragraph') {
              commentText = Array.isArray(answer)
                ? (answer[0]?.toString() ?? '')
                : (answer?.toString() ?? '');
            }
          }

          return {
            id: r._id,
            customer: customerName,
            outletId: r.outletId?._id ?? '',
            outletName: r.outletId?.name ?? 'Outlet',
            rating: r.totalRatings ?? 0,
            comment: commentText,
            date: new Date(r.createdAt).toLocaleDateString(),
          };
        });

        setAllReviews(mapped);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  /* ================= FILTER LOGIC ================= */
  const filteredReviews = useMemo(() => {
    if (!user) return [];

    let reviews = allReviews;

    if (user.role !== 'admin' && Array.isArray(user.outletId) && user.outletId.length > 0) {
      reviews = reviews.filter((r) => user.outletId!.includes(r.outletId));
    }

    if (selectedOutlet !== 'all') {
      reviews = reviews.filter((r) => r.outletId === selectedOutlet);
    }

    return reviews;
  }, [selectedOutlet, user, allReviews]);

  /*  OUTLET LIST  */
  const outlets = useMemo(() => {
    let base = allReviews;

    if (user?.role !== 'admin' && Array.isArray(user?.outletId)) {
      base = base.filter((r) => user.outletId!.includes(r.outletId));
    }

    return Array.from(new Map(base.map((r) => [r.outletId, r.outletName])).entries());
  }, [user, allReviews]);

  /*  SORT + GROUP  */
  const groupedReviews = useMemo(() => {
    const sorted = [...filteredReviews].sort((a, b) =>
      sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating,
    );

    const groups: Record<number, Review[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    sorted.forEach((review) => {
      if (groups[review.rating]) {
        groups[review.rating].push(review);
      }
    });

    return groups;
  }, [filteredReviews, sortOrder]);

  const ratingOrder = sortOrder === 'asc' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

  return (
    <Box p={4}>
      {/* HEADER */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant='h4' fontWeight={800}>
            Reviews
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Customer feedback grouped by rating
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          width={{ xs: '100%', sm: 'auto' }}
        >
          {/* Outlet Filter */}
          {(user?.role === 'admin' ||
            (Array.isArray(user?.outletId) && user.outletId.length > 1)) && (
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Outlet</InputLabel>
              <Select
                value={selectedOutlet}
                label='Filter by Outlet'
                onChange={(e) => setSelectedOutlet(e.target.value)}
              >
                <MenuItem value='all'>All Outlets</MenuItem>
                {outlets.map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Sort Filter */}
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>Sort by Rating</InputLabel>
            <Select
              value={sortOrder}
              label='Sort by Rating'
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <MenuItem value='desc'>Highest to Lowest</MenuItem>
              <MenuItem value='asc'>Lowest to Highest</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Loading */}
      {loading && <Typography>Loading reviews...</Typography>}

      {/* RATING SECTIONS */}
      {ratingOrder.map((rating) =>
        groupedReviews[rating].length > 0 ? (
          <Box key={rating} mb={5}>
            {/* Rating Header */}
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              {[...Array(rating)].map((_, i) => (
                <Star key={i} size={18} fill='#D4AF37' color='#D4AF37' />
              ))}
              <Typography fontWeight={700}>({groupedReviews[rating].length})</Typography>
            </Box>

            {/* Cards Grid */}
            <Box
              display='grid'
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={2}
            >
              {groupedReviews[rating].map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    width: 280,
                    p: 2.5,
                    borderRadius: '16px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    backgroundColor: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box display='flex' justifyContent='space-between'>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>{review.customer.charAt(0)}</Avatar>
                      <Typography fontWeight={700} fontSize={14}>
                        {review.customer}
                      </Typography>
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      {review.date}
                    </Typography>
                  </Box>

                  <Typography variant='caption' sx={{ fontWeight: 600, color: '#6B7280' }}>
                    {review.outletName}
                  </Typography>

                  <Box display='flex' gap={0.5}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} fill='#D4AF37' color='#D4AF37' />
                    ))}
                  </Box>

                  <Typography variant='body2' sx={{ fontSize: 14, color: '#374151' }}>
                    {review.comment}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null,
      )}

      {!loading && filteredReviews.length === 0 && (
        <Box py={10} textAlign='center'>
          <Typography color='text.secondary'>No reviews found for this selection.</Typography>
        </Box>
      )}
    </Box>
  );
}
