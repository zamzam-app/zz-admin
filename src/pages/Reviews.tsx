import { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Stack, Avatar } from '@mui/material';
import { Star } from 'lucide-react';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import type { ApiReview } from '../lib/types/review'; // ✅ IMPORT TYPE

/* ================= UI TYPE ================= */

interface Review {
  id: string;
  customer: string;
  outletId: string;
  outletName: string;
  date: string;
  rating: number;
  comment: string;
}

/* ================= COMPONENT ================= */

export default function Reviews() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD REVIEWS ================= */

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);

        const data = await reviewsApi.getAll(); // already typed in API

        const mapped: Review[] = data.map((r: ApiReview) => {
          const questionMap = new Map(
            r.formId?.questions?.map((q) => [q._id, q.type]) ?? []
          );

          let customerName = 'Anonymous';
          let commentText = '';

          for (const res of r.response ?? []) {
            const questionType = questionMap.get(res.questionId);

            if (questionType === 'short_answer') {
              customerName = res.answer?.[0] ?? 'Anonymous';
            }

            if (questionType === 'paragraph') {
              commentText = res.answer?.[0] ?? '';
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

    if (
      user.role !== 'admin' &&
      Array.isArray(user.outletId) &&
      user.outletId.length > 0
    ) {
      reviews = reviews.filter((r) =>
        user.outletId!.includes(r.outletId)
      );
    }

    if (selectedOutlet !== 'all') {
      reviews = reviews.filter(
        (r) => r.outletId === selectedOutlet
      );
    }

    return reviews;
  }, [selectedOutlet, user, allReviews]);

  /* ================= OUTLET LIST ================= */

  const outlets = useMemo(() => {
    let base = allReviews;

    if (
      user?.role !== 'admin' &&
      Array.isArray(user?.outletId)
    ) {
      base = base.filter((r) =>
        user.outletId!.includes(r.outletId)
      );
    }

    return Array.from(
      new Map(base.map((r) => [r.outletId, r.outletName])).entries()
    );
  }, [user, allReviews]);

  /* ================= RENDER ================= */

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer feedback across outlets
          </Typography>
        </Box>

        {(user?.role === 'admin' ||
          (Array.isArray(user?.outletId) &&
            user.outletId.length > 1)) && (
          <Box width={{ xs: '100%', sm: 280 }}>
            <Select
              label="Filter by Outlet"
              options={[
                { label: 'All Outlets', value: 'all' },
                ...outlets.map(([id, name]) => ({
                  label: name || id,
                  value: id,
                })),
              ]}
              value={selectedOutlet}
              onChange={(e) =>
                setSelectedOutlet(e.target.value)
              }
            />
          </Box>
        )}
      </Box>

      {loading && (
        <Typography>Loading reviews...</Typography>
      )}

      <Stack spacing={2}>
        {filteredReviews.map((review) => (
          <Card key={review.id} sx={{ p: 2.5, borderRadius: '20px' }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#1F2937',
                  }}
                >
                  {review.customer?.charAt(0)}
                </Avatar>

                <Box>
                  <Typography fontWeight={800}>
                    {review.customer}
                  </Typography>
                  <Typography variant="caption">
                    {review.outletName} • {review.date}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={0.5}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < review.rating ? '#D4AF37' : 'none'}
                    color={
                      i < review.rating
                        ? '#D4AF37'
                        : '#E5E7EB'
                    }
                  />
                ))}
              </Box>
            </Box>

            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              "{review.comment}"
            </Typography>
          </Card>
        ))}

        {!loading && filteredReviews.length === 0 && (
          <Box py={10} textAlign="center">
            <Typography color="text.secondary">
              No reviews found for this selection.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
