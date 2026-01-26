import React from 'react';

interface PlaceholderPageProps {
  title?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title = 'Page' }) => {
  return (
    <div className='p-6 bg-white rounded-lg shadow text-center'>
      <h1 className='text-3xl font-bold text-gray-800 mb-4'>{title}</h1>
      <p className='text-gray-600'>This feature is coming soon.</p>
    </div>
  );
};

export default PlaceholderPage;
