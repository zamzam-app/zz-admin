import React, { useState } from 'react';
import { Box, Typography, IconButton, Stack, Avatar } from '@mui/material';
import { Plus, Trash2, Edit2 } from 'lucide-react';

import Card from '../components/common/Card';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { EMPLOYEES } from '../__mocks__/employeesData';
import outletlist from '../__mocks__/outets.json';

type Employee = {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  outletId: string;
  outletName: string;
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({});

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
    if (!form.name || !form.outletName) return;

    if (editing) {
      setEmployees((prev) => prev.map((emp) => (emp.id === editing.id ? { ...editing, ...form } : emp)));
    } else {
      const selectedOutlet = outletlist.outlets.find((o) => o.name === form.outletName);
      setEmployees((prev) => [
        ...prev,
        {
          ...(form as Employee),
          id: Date.now().toString(),
          role: 'STAFF',
          outletId: selectedOutlet?.id || '',
          outletName: form.outletName || '',
        },
      ]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
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

        <Button variant='admin-primary' onClick={openAdd} className="rounded-2xl px-6 py-4">
          <Plus size={18} /> Add Employee
        </Button>
      </Box>

      {/* Employee List - Matching Reviews Style */}
      <Stack spacing={2}>
        {employees.map((emp) => (
          <Card 
            key={emp.id} 
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
            <Box display='flex' alignItems='center' justifyContent='space-between'>
              <Box display='flex' alignItems='center' gap={1.5}>
                {/* Profile Avatar */}
                <Avatar 
                  variant="rounded" 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '12px', 
                    bgcolor: '#1F2937',
                    fontWeight: 700
                  }}
                >
                  {emp.name.charAt(0)}
                </Avatar>

                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color='#1F2937' sx={{ lineHeight: 1.1 }}>
                    {emp.name} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '0.85rem' }}>@{emp.username}</span>
                  </Typography>
                  <Typography variant='caption' sx={{ color: '#3B82F6', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                    {emp.outletName}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    {emp.email} • {emp.phone}
                  </Typography>
                </Box>
              </Box>

              {/* Actions */}
              <Box display="flex" gap={0.5}>
                <IconButton onClick={() => openEdit(emp)} size="small" sx={{ color: '#3B82F6', bgcolor: '#EFF6FF', '&:hover': { bgcolor: '#DBEAFE' } }}>
                  <Edit2 size={16} />
                </IconButton>
                <IconButton onClick={() => handleDelete(emp.id)} size="small" sx={{ color: '#EF4444', bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FEE2E2' } }}>
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </Stack>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className='flex flex-col gap-8'>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <Input
              label='Full Name'
              placeholder="Enter name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label='Username'
              placeholder="unique_username"
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <Input
              label='Email'
              type="email"
              placeholder="email@zamzam.com"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label='Phone'
              placeholder="+91..."
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label='Password'
              type="password"
              placeholder="••••••••"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Select
              label='Assigned Outlet'
              options={outletlist.outlets.map((o) => ({ label: o.name, value: o.name }))}
              value={form.outletName || ''}
              onChange={(e) => {
                const outlet = outletlist.outlets.find((o) => o.name === e.target.value);
                setForm({
                  ...form,
                  outletId: outlet?.id,
                  outletName: outlet?.name,
                });
              }}
            />
          </div>

          <div className='flex justify-end items-center gap-4 pt-6 border-t border-gray-100'>
            <Button type="button" variant='ghost' onClick={() => setOpen(false)} className="font-bold text-gray-400">
              Cancel
            </Button>
            <Button type='submit' variant='admin-primary' className="px-12 py-3.5 rounded-2xl font-black shadow-lg">
              {editing ? 'Update Employee' : 'Save Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </Box>
  );
}