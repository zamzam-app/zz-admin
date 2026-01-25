import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

const ErrorBoundary: React.FC = () => {
  const error = useRouteError();
  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    // error is type `ErrorResponse`
    errorMessage = error.statusText || error.data?.message || 'Unknown error';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-4'>
      <h1 className='text-4xl font-bold mb-4'>Oops!</h1>
      <p className='text-lg mb-2'>Sorry, an unexpected error has occurred.</p>
      <p className='italic text-gray-600'>
        <i>{errorMessage}</i>
      </p>
      <a
        href='/'
        className='mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
      >
        Go to Home
      </a>
    </div>
  );
};

export default ErrorBoundary;
