import React, { useState } from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
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
    if (!form.name || !form.outletId) return;

    if (editing) {
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? { ...editing, ...form } : e)));
    } else {
      setEmployees((prev) => [
        ...prev,
        {
          ...(form as Employee),
          id: Date.now().toString(),
          role: 'STAFF',
          outletName: outletlist.outlets.find((o) => o.id === form.outletId)?.name || '',
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
      <Box display='flex' justifyContent='space-between' mb={4}>
        <Box>
          <Typography variant='h4' fontWeight={800} color='#1F2937'>
            Employees
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage outlet staff (non-managers)
          </Typography>
        </Box>

        <Button variant='admin-primary' onClick={openAdd}>
          <Plus size={18} /> Add Employee
        </Button>
      </Box>

      {/* Grid */}
      <Stack spacing={3}>
        {employees.map((emp) => (
          <Card key={emp.id}>
            <Box display='flex' justifyContent='space-between'>
              <Box>
                <Typography fontWeight={700} color='#1F2937'>
                  {emp.name} • {emp.username}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {emp.email} • {emp.phone}
                </Typography>
                <Typography variant='caption' display='block' color='text.secondary'>
                  {emp.outletName}
                </Typography>
              </Box>

              <Box>
                <IconButton onClick={() => openEdit(emp)}>
                  <Edit2 size={18} />
                </IconButton>
                <IconButton color='error' onClick={() => handleDelete(emp.id)}>
                  <Trash2 size={18} />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </Stack>

      {/* Modal - Replacing Dialog with common Modal for consistency */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSave} className='space-y-4'>
          <Input
            label='Name'
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          
          <Input
            label='UserName'
            value={form.username || ''}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label='Email'
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label='Password'
            value={form.password || ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label='Phone'
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <Select
            label='Outlet'
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

          <div className='flex justify-end gap-4 pt-4'>
            <Button variant='ghost' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' variant='admin-primary'>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </Box>
  );
}
