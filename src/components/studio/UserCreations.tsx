import { useState, useMemo, useEffect, useRef } from 'react';
import { Image, Modal, Badge } from 'antd';
import {
  Phone,
  Calendar,
  User as UserIcon,
  Download,
  Search,
  Filter,
  X,
  Clock,
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useApiInfiniteQuery } from '../../lib/react-query/use-api-hooks';
import { studioApi } from '../../lib/services/api/studio.api';
import LoadingSpinner from '../common/LoadingSpinner';
import { NoDataFallback } from '../common/NoDataFallback';
import { Button } from '../common/Button';
import type { GeneratedCake, CustomCakesResponse } from '../../lib/types/product';

const CREATION_KEYS = 'user-creations';

const parseDob = (dobString: string | undefined): Date | null => {
  if (!dobString || dobString === '—') return null;

  let parsed: Date;

  if (dobString.includes('/')) {
    const parts = dobString.split('/');
    if (parts.length < 3) return null;
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    if (!day || !month || !year) return null;
    parsed = new Date(year, month - 1, day);
  } else {
    parsed = new Date(dobString);
  }

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const calculateAge = (dobString: string | undefined): string => {
  const birthDate = parseDob(dobString);
  if (!birthDate) return dobString && dobString !== '—' ? dobString : '—';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return `${age} yr`;
};

const formatDobWithAge = (dobString: string | undefined): string => {
  const birthDate = parseDob(dobString);
  if (!birthDate) return dobString && dobString !== '—' ? dobString : '—';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const day = String(birthDate.getDate()).padStart(2, '0');
  const month = String(birthDate.getMonth() + 1).padStart(2, '0');
  const year = birthDate.getFullYear();

  return `${day}/${month}/${year} (${age} years)`;
};

export const UserCreations = () => {
  const [selectedCreation, setSelectedCreation] = useState<GeneratedCake | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useApiInfiniteQuery<CustomCakesResponse>([CREATION_KEYS], (page: number) =>
      studioApi.getCreations(page, 15),
    );

  const allCreations = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filtering Logic
  const filteredCreations = useMemo(() => {
    return allCreations.filter((c) => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch =
        (c.userId.phoneNumber?.includes(searchQuery) ?? false) ||
        (c.userId.name?.toLowerCase().includes(searchStr) ?? false) ||
        (c.prompt?.toLowerCase().includes(searchStr) ?? false);
      const matchesGender =
        genderFilter === 'all' || c.userId.gender?.toLowerCase() === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [allCreations, searchQuery, genderFilter]);

  const handleDownload = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `cake-creation-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <NoDataFallback
        title='Failed to load gallery'
        description={error.message}
        action={
          <Button variant='admin-primary' onClick={() => refetch()} className='rounded-2xl'>
            Refresh
          </Button>
        }
      />
    );
  }

  return (
    <div className='flex flex-col h-full overflow-hidden relative'>
      {/* Sticky Header with Search & Filters */}
      <div className='sticky top-0 z-20 bg-gray-50/80 backdrop-blur-xl pb-6 pt-2'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50'>
          <div className='relative grow max-w-md group'>
            <Search
              className='absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors'
              size={20}
            />
            <input
              type='text'
              placeholder='Search by phone, name or prompt...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-14 pr-4 py-4 bg-[#F9FAFB] border border-transparent focus:border-[#D4AF37]/30 focus:bg-white rounded-3xl outline-none transition-all text-sm font-medium'
            />
          </div>

          <div className='flex items-center gap-2 overflow-x-auto pb-1 md:pb-0'>
            <div className='flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl mr-2 whitespace-nowrap text-gray-400'>
              <Filter size={16} />
              <span className='text-[10px] font-black uppercase tracking-wider'>Filter:</span>
            </div>
            {(['all', 'male', 'female'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all outline-none focus:outline-none ${
                  genderFilter === gender
                    ? 'bg-[#1F2937] text-white shadow-lg shadow-gray-200'
                    : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Gallery Area */}
      <div className='grow px-2 pb-12 overflow-y-auto scrollbar-hide'>
        {filteredCreations.length === 0 ? (
          <NoDataFallback
            title='No creations found'
            description='We couldn’t find any AI creations matching your search.'
          />
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8'>
            {filteredCreations.map((creation) => (
              <CreationCard
                key={creation._id}
                creation={creation}
                onSelect={() => setSelectedCreation(creation)}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}

        {/* Load More Marker */}
        <div ref={loadMoreRef} className='py-12 flex justify-center'>
          {isFetchingNextPage ? (
            <div className='flex items-center gap-3 text-gray-400 font-bold animate-pulse'>
              <Loader2 className='animate-spin' size={20} />
              <span className='text-xs uppercase tracking-widest'>Loading more cakes...</span>
            </div>
          ) : hasNextPage ? (
            <div className='h-1' />
          ) : (
            filteredCreations.length > 0 && (
              <div className='text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 flex items-center gap-4'>
                <div className='h-px w-12 bg-gray-100' />
                End of Gallery
                <div className='h-px w-12 bg-gray-100' />
              </div>
            )
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        open={!!selectedCreation}
        onCancel={() => setSelectedCreation(null)}
        footer={null}
        closeIcon={
          <div className='p-2 bg-[#F9FAFB] rounded-full hover:bg-gray-100 transition-colors'>
            <X size={20} className='text-gray-500' />
          </div>
        }
        width={1000}
        centered
        className='p-0 overflow-hidden'
        styles={{ body: { padding: 0 } }}
        zIndex={2000}
      >
        {selectedCreation && (
          <div className='flex flex-col lg:flex-row h-full max-h-[85vh] overflow-hidden'>
            <div className='lg:w-1/2 bg-[#F9FAFB] flex items-stretch'>
              <div className='relative w-full overflow-hidden'>
                <img
                  src={selectedCreation.imageUrl}
                  className='w-full h-full object-cover select-none'
                  alt='Selected Cake'
                />
              </div>
            </div>

            <div className='lg:w-1/2 p-8 lg:p-12 flex flex-col overflow-y-auto bg-white'>
              <div className='grow uppercase font-black'>
                <div className='flex items-center gap-2 text-[#D4AF37] mb-2 tracking-[0.2em] text-[10px]'>
                  <Sparkles size={14} /> AI Generation Analysis
                </div>
                <h2 className='text-2xl lg:text-3xl text-[#1F2937] mb-8 tracking-tighter'>
                  Creation Details
                </h2>

                <div className='grid grid-cols-1 gap-6 mb-8'>
                  {selectedCreation.userId.name && (
                    <DetailRow
                      icon={<UserIcon size={18} />}
                      label='Customer'
                      value={selectedCreation.userId.name}
                    />
                  )}
                  <DetailRow
                    icon={<Phone size={18} />}
                    label='Contact'
                    value={selectedCreation.userId.phoneNumber || 'N/A'}
                  />
                  <DetailRow
                    icon={<Calendar size={18} />}
                    label='Age'
                    value={formatDobWithAge(selectedCreation.userId.dob)}
                  />
                  <DetailRow
                    icon={<UserIcon size={18} />}
                    label='Gender'
                    value={selectedCreation.userId.gender || 'N/A'}
                  />
                </div>

                {selectedCreation.prompt && (
                  <div className='bg-[#F9FAFB] p-6 rounded-3xl border border-gray-50 mb-4'>
                    <p className='text-[10px] text-gray-400 mb-3 tracking-[0.2em]'>
                      Visualisation Prompt
                    </p>
                    <p className='text-sm text-gray-600 italic font-medium lowercase tracking-normal leading-relaxed'>
                      "{selectedCreation.prompt}"
                    </p>
                  </div>
                )}
              </div>

              <div className='flex items-center gap-4 mt-auto pt-8 border-t border-gray-100 sticky bottom-0 bg-white'>
                <Button
                  variant='admin-primary'
                  className='grow h-14 rounded-2xl shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-3'
                  onClick={(e) =>
                    handleDownload(e, selectedCreation.imageUrl, selectedCreation._id)
                  }
                >
                  <Download size={20} /> Download Source
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Extracted Creation Card Component
const CreationCard = ({
  creation,
  onSelect,
  onDownload,
}: {
  creation: GeneratedCake;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent, url: string, id: string) => void;
}) => (
  <div
    onClick={onSelect}
    className='group bg-white rounded-[2.5rem] border border-transparent hover:border-[#D4AF37]/20 p-2.5 transition-all duration-500 hover:shadow-2xl hover:shadow-[#D4AF37]/5 cursor-pointer transform hover:-translate-y-1'
  >
    <div className='relative h-64 rounded-4xl overflow-hidden bg-[#F9FAFB]'>
      <Image
        src={creation.imageUrl}
        alt='Generated Cake'
        preview={false}
        className='w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110'
      />

      <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

      <div className='absolute bottom-6 left-6 right-6 flex items-center justify-between translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30'>
            <Info size={18} className='text-white' />
          </div>
          <span className='text-white font-black text-[10px] uppercase tracking-[0.2em]'>
            Details
          </span>
        </div>
        <button
          onClick={(e) => onDownload(e, creation.imageUrl, creation._id)}
          className='w-10 h-10 bg-[#D4AF37] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 hover:scale-110 transition-transform'
        >
          <Download size={18} />
        </button>
      </div>

      <div className='absolute top-5 left-5'>
        <div className='px-3 py-1.5 bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl flex items-center gap-2 shadow-sm'>
          <Clock size={12} className='text-[#D4AF37]' />
          <span className='text-[9px] font-black text-gray-600 uppercase tracking-widest'>
            {new Date(creation.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>

    <div className='px-5 py-6'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex flex-col gap-0.5 max-w-[70%]'>
          {creation.userId.name ? (
            <span className='text-[13px] font-black text-[#1F2937] truncate group-hover:text-[#D4AF37] transition-colors'>
              {creation.userId.name}
            </span>
          ) : (
            <div className='flex items-center gap-1.5'>
              <Phone size={12} className='text-[#D4AF37]' />
              <span className='text-[13px] font-black text-[#1F2937]'>
                {creation.userId.phoneNumber || 'N/A'}
              </span>
            </div>
          )}
        </div>
        {creation.userId.gender && (
          <Badge
            status={creation.userId.gender.toLowerCase() === 'male' ? 'processing' : 'warning'}
            text={
              <span className='text-[9px] font-black uppercase text-gray-400 tracking-tight'>
                {creation.userId.gender}
              </span>
            }
          />
        )}
      </div>

      <div className='flex items-center gap-4 text-[9px] font-black uppercase text-gray-400 tracking-widest'>
        <div className='flex items-center gap-1.5'>
          <Calendar size={12} className='text-gray-300' />
          {calculateAge(creation.userId.dob)}
        </div>
        <div className='w-1 h-1 bg-gray-200 rounded-full' />
        <div className='flex items-center gap-1.5 text-[#D4AF37]/70 flex-1 truncate'>
          <Sparkles size={11} />
          <span className='truncate'>{creation.prompt}</span>
        </div>
      </div>
    </div>
  </div>
);

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className='flex items-center gap-4 group'>
    <div className='w-12 h-12 bg-[#F9FAFB] text-[#D4AF37] rounded-2xl flex items-center justify-center border border-gray-50 transition-all duration-300 group-hover:bg-[#1F2937] group-hover:text-white'>
      {icon}
    </div>
    <div>
      <p className='text-[10px] text-gray-400 tracking-[0.15em] mb-0.5'>{label}</p>
      <p className='text-base text-[#1F2937] font-bold'>{value}</p>
    </div>
  </div>
);
