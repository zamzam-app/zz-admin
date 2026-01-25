import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is handled in context and displayed below
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className='text-2xl font-bold mb-6 text-center'>Login</h2>
      {error && (
        <div className='mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
          {error}
        </div>
      )}
      <form onSubmit={handleLogin} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            placeholder='admin@example.com'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            placeholder='********'
          />
        </div>
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <div className='mt-4 text-center'>
        <Link to='/forgot-password' className='text-sm text-indigo-600 hover:text-indigo-500'>
          Forgot your password?
        </Link>
      </div>
    </div>
  );
};

export default Login;
