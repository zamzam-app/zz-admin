import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    login('fake-token', { name: 'Admin User' });
    navigate('/dashboard');
  };

  return (
    <div>
      <h2 className='text-2xl font-bold mb-6 text-center'>Login</h2>
      <form onSubmit={handleLogin} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Email</label>
          <input
            type='email'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            placeholder='admin@example.com'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700'>Password</label>
          <input
            type='password'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            placeholder='********'
          />
        </div>
        <button
          type='submit'
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          Sign In
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
