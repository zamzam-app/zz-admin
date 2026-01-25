import React from 'react';
import { useForgotPassword } from '../lib/context/ForgotPasswordContext';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const { step, setStep, email, setEmail } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') setStep('otp');
    else if (step === 'otp') setStep('reset');
    else alert('Password Reset Successfully');
  };

  return (
    <div>
      <h2 className='text-2xl font-bold mb-6 text-center'>
        {step === 'email' && 'Forgot Password'}
        {step === 'otp' && 'Enter OTP'}
        {step === 'reset' && 'Reset Password'}
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {step === 'email' && (
          <div>
            <label className='block text-sm font-medium text-gray-700'>Email Address</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            />
          </div>
        )}

        {step === 'otp' && (
          <div>
            <label className='block text-sm font-medium text-gray-700'>OTP Code</label>
            <input
              type='text'
              required
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
              placeholder='123456'
            />
          </div>
        )}

        {step === 'reset' && (
          <div>
            <label className='block text-sm font-medium text-gray-700'>New Password</label>
            <input
              type='password'
              required
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border'
            />
          </div>
        )}

        <button
          type='submit'
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700'
        >
          {step === 'email' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
        </button>
      </form>
      <div className='mt-4 text-center'>
        <Link to='/login' className='text-sm text-indigo-600 hover:text-indigo-500'>
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
