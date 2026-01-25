import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import { Logo } from '../components/common/Logo';

const Login: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/overview');
    } catch {
      // Error is handled in context and displayed
    }
  };

  return (
    <div className='min-h-screen bg-[#111827] flex items-center justify-center p-4 px-4 sm:px-6 relative overflow-hidden w-full h-full'>
      {/* Glow background */}
      <div className='absolute -top-40 -left-40 w-72 h-72 sm:w-96 sm:h-96 bg-[#D4AF37]/10 rounded-full blur-[120px]' />
      <div className='absolute -bottom-40 -right-40 w-72 h-72 sm:w-96 sm:h-96 bg-[#D4AF37]/10 rounded-full blur-[120px]' />

      <div className='w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-2xl z-10'>
        {/* Logo */}
        <div className='flex flex-col items-center mb-8 sm:mb-10'>
          <Logo className='w-20 h-20 sm:w-24 sm:h-24 mb-6' />
          <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight text-center'>
            ZamZam Admin
          </h1>
          <p className='text-gray-400 text-[10px] sm:text-xs uppercase tracking-[0.3em] mt-1'>
            Secure Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5 sm:space-y-6'>
          <div className='relative'>
            <Mail size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
            <input
              type='email'
              placeholder='Email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm sm:text-base'
              required
            />
          </div>

          <div className='relative'>
            <Lock size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm sm:text-base'
              required
            />
          </div>

          {error && (
            <div className='bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center'>
              {error}
            </div>
          )}

          <button
            type='submit'
            className='w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#D4AF37] text-[#1F2937] font-black hover:bg-[#c4a132] transition-all active:scale-[0.98] text-sm sm:text-base'
          >
            Sign In
          </button>
        </form>

        <div className='mt-6 sm:mt-8 text-center'>
          <button className='text-[10px] sm:text-xs text-gray-400 hover:text-gray-200 transition-colors uppercase tracking-widest cursor-pointer' onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
