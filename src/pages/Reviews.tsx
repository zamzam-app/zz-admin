import { useMemo, useState } from 'react';
import { Box, Typography, Stack, Avatar } from '@mui/material';
import { Star } from 'lucide-react';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import { REVIEWS } from '../__mocks__/reviewsData';
import { useAuth } from '../lib/context/AuthContext';

// 1. Define the Review interface to fix the TS error
interface Review {
  id: string;
  customer: string;
  customerImage?: string; // Optional property
  outletId: string;
  outletName: string;
  date: string;
  rating: number;
  comment: string;
}

export default function Reviews() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');

  // 2. Cast the mock data to our Review type
  const allReviews = REVIEWS as Review[];

  const filteredReviews = useMemo(() => {
    if (!user) return [];
    let reviewsToFilter = allReviews;

    // Filter based on user role/permissions
    if (user.role !== 'admin' && user.outletId && user.outletId.length > 0) {
      reviewsToFilter = allReviews.filter((r) => user.outletId?.includes(r.outletId));
    }

    // Filter based on dropdown selection
    if (selectedOutlet === 'all') return reviewsToFilter;
    return reviewsToFilter.filter((r) => r.outletId === selectedOutlet);
  }, [selectedOutlet, user, allReviews]);

  const outlets = useMemo(() => {
    let baseReviews = allReviews;
    if (user?.role !== 'admin' && user?.outletId) {
      baseReviews = allReviews.filter((r) => user.outletId?.includes(r.outletId));
    }

    const uniqueOutlets = Array.from(
      new Map(baseReviews.map((r) => [r.outletId, r.outletName])).entries(),
    );
    return uniqueOutlets;
  }, [user, allReviews]);

  return (
    <Box>
      {/* Header Section */}
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

      {/* Sentiment Archive Style Review List */}
      <Stack spacing={2}>
        {filteredReviews.map((review) => (
          <Card 
            key={review.id} 
            sx={{
              p: 2.5,
              border: '2px solid transparent',
              borderRadius: '20px',
              transition: 'all 0.2s ease-in-out',
              cursor: 'default',
              '&:hover': {
                borderColor: '#3B82F6', 
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            <Box display='flex' alignItems='center' justifyContent='space-between' mb={1.5}>
              <Box display='flex' alignItems='center' gap={1.5}>
                {/* Avatar with fallback to first letter */}
                <Avatar 
                  variant="rounded" 
                  src={review.customerImage}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '12px', 
                    bgcolor: '#1F2937',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}
                >
                  {review.customer?.charAt(0)}
                </Avatar>
                
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color='#1F2937' sx={{ lineHeight: 1.1 }}>
                    {review.customer}
                  </Typography>
                  <Typography 
                    variant='caption' 
                    sx={{ 
                      color: '#3B82F6', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      fontSize: '0.65rem',
                      letterSpacing: '0.05em' 
                    }}
                  >
                    {review.outletName} • {review.date}
                  </Typography>
                </Box>
              </Box>

              {/* Dynamic Star Rating */}
              <Box display='flex' gap={0.25}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < review.rating ? "#D4AF37" : "none"}
                    color={i < review.rating ? "#D4AF37" : "#E5E7EB"}
                  />
                ))}
              </Box>
            </Box>

            {/* Compressed Quote Style Comment */}
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic', 
                color: 'text.secondary', 
                fontSize: '0.95rem',
                lineHeight: 1.4,
                pl: 0.5
              }}
            >
              "{review.comment}"
            </Typography>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Box py={10} textAlign="center">
            <Typography color='text.secondary'>No reviews found for this selection.</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}