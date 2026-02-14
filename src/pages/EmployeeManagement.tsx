import React, { useState } from 'react';
import { Box, Typography, IconButton, Avatar, CircularProgress } from '@mui/material';
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

import Card from '../components/common/Card';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { usersApi } from '../lib/services/api/users.api';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { UpdateUserPayload, CreateUserPayload } from '../lib/types/user';

type Employee = {
  id?: string;
  name: string;
  userName?: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role: string;
};

const EMPLOYEE_KEYS = ['employees'];

export default function EmployeeManagement() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({});

  // 1. Fetching Data
  const { data: employees = [], isLoading } = useApiQuery(EMPLOYEE_KEYS, usersApi.getAll);

  // 2. Mutations
  const createMutation = useApiMutation(
    (data: CreateUserPayload) => usersApi.create(data),
    [EMPLOYEE_KEYS],
    {
      onSuccess: () => setOpen(false),
    },
  );

  const updateMutation = useApiMutation(
    (data: { id: string; payload: UpdateUserPayload }) => usersApi.update(data.id, data.payload),
    [EMPLOYEE_KEYS],
    {
      onSuccess: () => setOpen(false),
    },
  );

  const deleteMutation = useApiMutation((id: string) => usersApi.delete(id), [EMPLOYEE_KEYS]);

  const openAdd = () => {
    setForm({});
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm(emp);
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.userName || !form.role) return;

    if (editing && editing.id) {
      updateMutation.mutate({
        id: editing.id,
        payload: {
          name: form.name,
          userName: form.userName,
          email: form.email,
          role: form.role,
          phoneNumber: form.phoneNumber,
        },
      });
    } else {
      createMutation.mutate({
        name: form.name!,
        userName: form.userName!,
        email: form.email!,
        role: form.role!,
        phoneNumber: form.phoneNumber!,
        password: form.password,
      });
    }
  };

  const handleDelete = (id: string | undefined) => {
    if (id && window.confirm('Are you sure you want to delete this employee?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      {/* Header */}
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
            Employees
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage outlet staff (non-managers)
          </Typography>
        </Box>

        <Button variant='admin-primary' onClick={openAdd} className='rounded-2xl px-6 py-4'>
          <Plus size={18} /> Add Employee
        </Button>
      </Box>

      {/* Employee Grid */}
      <Box sx={{ flexGrow: 1, minHeight: '400px', position: 'relative' }}>
        {isLoading ? (
          <Box display='flex' justifyContent='center' alignItems='center' py={12}>
            <CircularProgress size={48} sx={{ color: '#3B82F6' }} />
          </Box>
        ) : employees.length === 0 ? (
          <Box
            textAlign='center'
            py={12}
            sx={{
              bgcolor: 'rgba(249, 250, 251, 0.7)',
              borderRadius: '32px',
              border: '2px dashed #E5E7EB',
            }}
          >
            <Typography variant='h6' fontWeight={600} color='text.secondary'>
              No employees found
            </Typography>
            <Typography variant='body2' color='text.disabled'>
              Try adding a new member to your team
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {employees.map((emp) => (
              <Card
                key={emp.id}
                sx={{
                  p: 3,
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: '24px',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  background: '#FFFFFF',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity:
                    deleteMutation.isPending && deleteMutation.variables === emp.id ? 0.6 : 1,
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
                    borderColor: '#3B82F6',
                    '& .action-buttons': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                {/* Header Info */}
                <Box display='flex' flexDirection='column' alignItems='center' textAlign='center'>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
                      boxShadow: '0 8px 16px rgba(31, 41, 55, 0.15)',
                    }}
                  >
                    {emp.name?.charAt(0) || '?'}
                  </Avatar>

                  <Typography variant='h6' fontWeight={800} color='#111827' sx={{ mb: 0.5 }}>
                    {emp.name || 'Anonymous'}
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#6B7280', mb: 1.5 }}>
                    @{emp.userName || 'unknown'}
                  </Typography>

                  {/* Role Badge */}
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: '100px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 3,
                      ...(emp.role.toLowerCase() === 'manager'
                        ? { bgcolor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }
                        : emp.role.toLowerCase() === 'admin'
                          ? { bgcolor: '#F5F3FF', color: '#6D28D9', border: '1px solid #EDE9FE' }
                          : { bgcolor: '#F9FAFB', color: '#374151', border: '1px solid #F3F4F6' }),
                    }}
                  >
                    {emp.role}
                  </Box>

                  {/* Contact Details */}
                  <Box sx={{ width: '100%', pt: 2, borderTop: '1px solid #F3F4F6', mt: 'auto' }}>
                    <Typography
                      variant='caption'
                      display='block'
                      color='text.secondary'
                      sx={{ mb: 0.5 }}
                    >
                      {emp.email}
                    </Typography>
                    <Typography variant='caption' fontWeight={600} color='text.secondary'>
                      {emp.phoneNumber}
                    </Typography>
                  </Box>
                </Box>

                {/* Floating Action Buttons */}
                <Box
                  className='action-buttons'
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    display: 'flex',
                    gap: 1,
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <IconButton
                    disabled={deleteMutation.isPending}
                    onClick={() => openEdit(emp)}
                    size='small'
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#3B82F6',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      '&:hover': { bgcolor: '#F3F4F6' },
                    }}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton
                    disabled={deleteMutation.isPending && deleteMutation.variables === emp.id}
                    onClick={() => handleDelete(emp.id)}
                    size='small'
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#EF4444',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      '&:hover': { bgcolor: '#F3F4F6' },
                    }}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === emp.id ? (
                      <CircularProgress size={16} color='inherit' />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        maxWidth='md'
      >
        <form onSubmit={handleSave} className='flex flex-col gap-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8'>
            <Input
              label='Full Name'
              placeholder='Enter name'
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label='Username'
              placeholder='test-manager-01'
              value={form.userName || ''}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              required
            />
            <Input
              label='Email'
              type='email'
              placeholder='testmanager01@zamzam.com'
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label='Phone Number'
              placeholder='+1234567890'
              value={form.phoneNumber || ''}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
            />
            <Select
              label='Role'
              options={[
                { label: 'Manager', value: 'manager' },
                { label: 'Staff', value: 'staff' },
                { label: 'Admin', value: 'admin' },
              ]}
              value={form.role || ''}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Input
              label='Password'
              type='password'
              placeholder='password123'
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
            />
          </div>

          <div className='flex justify-end items-center gap-4 pt-6 border-t border-gray-100'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setOpen(false)}
              className='font-bold text-gray-400'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='admin-primary'
              disabled={createMutation.isPending || updateMutation.isPending}
              className='px-12 py-3.5 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2'
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 size={18} className='animate-spin' />
                  Processing...
                </>
              ) : editing ? (
                'Update Employee'
              ) : (
                'Save Employee'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </Box>
  );
}
