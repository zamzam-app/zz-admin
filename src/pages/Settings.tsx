import React, { useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { User, Lock, Shield, Mail } from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { Button } from '../components/common/Button';

export default function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to update password would go here
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    alert('Password updated successfully (mock)');
    setPasswordForm({ currPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography
          variant='h4'
          fontWeight={800}
          color='#1F2937'
          sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
        >
          Settings
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage your account and preferences
        </Typography>
      </Box>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8'>
        {/* Profile Card */}
        <Card className='p-5 md:p-8'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-6'>
            <div className='w-12 h-12 rounded-2xl bg-[#F5E6CA] text-[#1F2937] flex items-center justify-center shrink-0'>
              <User size={24} />
            </div>
            <div>
              <Typography variant='h6' fontWeight={800} color='#1F2937'>
                Profile Information
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Your account details
              </Typography>
            </div>
          </div>

          <Stack spacing={3}>
            <div>
              <Typography
                variant='caption'
                color='text.secondary'
                fontWeight={600}
                mb={0.5}
                display='block'
              >
                FULL NAME
              </Typography>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100'>
                <User size={16} className='text-gray-400 shrink-0' />
                <Typography fontWeight={500} color='#1F2937' noWrap>
                  {user?.name}
                </Typography>
              </div>
            </div>

            <div>
              <Typography
                variant='caption'
                color='text.secondary'
                fontWeight={600}
                mb={0.5}
                display='block'
              >
                EMAIL ADDRESS
              </Typography>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100'>
                <Mail size={16} className='text-gray-400 shrink-0' />
                <Typography fontWeight={500} color='#1F2937' noWrap>
                  {user?.email}
                </Typography>
              </div>
            </div>

            <div>
              <Typography
                variant='caption'
                color='text.secondary'
                fontWeight={600}
                mb={0.5}
                display='block'
              >
                ROLE
              </Typography>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100'>
                <Shield size={16} className='text-gray-400 shrink-0' />
                <Typography fontWeight={500} color='#1F2937' sx={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Security Card */}
        <Card className='p-5 md:p-8'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-6'>
            <div className='w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center shrink-0'>
              <Lock size={24} />
            </div>
            <div>
              <Typography variant='h6' fontWeight={800} color='#1F2937'>
                Security
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Update your password
              </Typography>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <Input
              label='Current Password'
              type='password'
              name='currPassword'
              value={passwordForm.currPassword}
              onChange={handleChange}
              required
              sx={{ mb: 1 }}
            />
            <Input
              label='New Password'
              type='password'
              name='newPassword'
              value={passwordForm.newPassword}
              onChange={handleChange}
              required
              sx={{ mb: 1 }}
            />
            <Input
              label='Confirm Password'
              type='password'
              name='confirmPassword'
              value={passwordForm.confirmPassword}
              onChange={handleChange}
              required
              sx={{ mb: 1 }}
            />

            <div className='pt-2 flex justify-end'>
              <Button type='submit' variant='admin-primary'>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Box>
  );
}
