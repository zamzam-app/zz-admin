import { useState } from 'react';
import { Popconfirm, Switch } from 'antd';
import { Box, Typography, IconButton, Avatar, CircularProgress, Chip } from '@mui/material';
import { Plus, Trash2, Edit2 } from 'lucide-react';

import Card from '../components/common/Card';
import { Button } from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AddModal } from '../components/manager/AddModal';
import { DeleteModal } from '../components/common/DeleteModal';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { usersApi } from '../lib/services/api/users.api';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import { UpdateUserPayload, User } from '../lib/types/manager';

const EMPLOYEE_KEYS = ['employees'];

type ModalState =
  | null
  | { type: 'add' }
  | { type: 'edit'; user: User }
  | { type: 'delete'; user: User };

function getEmpId(e: User | null | undefined): string | undefined {
  return e ? (e._id ?? e.id) : undefined;
}

export default function ManagersPage() {
  const [modal, setModal] = useState<ModalState>(null);
  const [blockConfirmEmployee, setBlockConfirmEmployee] = useState<User | null>(null);

  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery(EMPLOYEE_KEYS, usersApi.getManagers);
  const deleteMutation = useApiMutation((id: string) => usersApi.delete(id), [EMPLOYEE_KEYS]);
  const blockMutation = useApiMutation(
    (data: { id: string; isActive: boolean }) =>
      usersApi.update(data.id, {
        isActive: data.isActive,
      } as UpdateUserPayload),
    [EMPLOYEE_KEYS],
    {
      onSuccess: () => setBlockConfirmEmployee(null),
    },
  );

  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setModal(null),
    });
  };

  const handleBlockConfirm = (emp: User) => {
    const id = getEmpId(emp);
    if (id) {
      blockMutation.mutate({
        id,
        isActive: !(emp.isActive ?? true),
      });
    }
  };

  const addModalOpen = modal !== null && (modal.type === 'add' || modal.type === 'edit');
  const editing = modal?.type === 'edit' ? modal.user : null;
  const deleteModalOpen = modal?.type === 'delete';
  const selectedEmployee = modal?.type === 'delete' ? modal.user : null;

  if (error) {
    return (
      <Box>
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
              Managers
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage outlet managers
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: '24px',
            border: '1px solid #f3f4f6',
            overflow: 'hidden',
          }}
        >
          <NoDataFallback
            title='Failed to load employees'
            description={error.message}
            action={
              <Button variant='admin-primary' onClick={() => refetch()} className='rounded-2xl'>
                Try again
              </Button>
            }
          />
        </Box>
      </Box>
    );
  }

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
            Managers
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage outlet managers
          </Typography>
        </Box>

        <Button
          variant='admin-primary'
          onClick={() => setModal({ type: 'add' })}
          className='rounded-2xl px-6 py-4'
        >
          <Plus size={18} /> Add Employee
        </Button>
      </Box>

      {/* Employee Grid */}
      <Box sx={{ flexGrow: 1, minHeight: '400px', position: 'relative' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : employees.length === 0 ? (
          <NoDataFallback
            title='No employees found'
            description='Try adding a new member to your team'
            action={
              <Button
                variant='admin-primary'
                onClick={() => setModal({ type: 'add' })}
                className='rounded-2xl'
              >
                Add Employee
              </Button>
            }
          />
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
                key={getEmpId(emp) ?? emp.email ?? ''}
                sx={{
                  p: 3,
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: '24px',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  background: '#FFFFFF',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity:
                    emp.isActive === false
                      ? 0.6
                      : deleteMutation.isPending && deleteMutation.variables === getEmpId(emp)
                        ? 0.6
                        : 1,

                  filter: emp.isActive === false ? 'grayscale(60%)' : 'none',
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
                {emp.isActive === false && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      bgcolor: '#FEE2E2',
                      color: '#B91C1C',
                      px: 2,
                      py: 0.5,
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      letterSpacing: '0.05em',
                      zIndex: 2,
                    }}
                  >
                    BLOCKED
                  </Box>
                )}
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
                  <Box display='flex' alignItems='center' gap={1} mb={3}>
                    <Chip
                      label={emp.role}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #DBEAFE',
                      }}
                      variant='outlined'
                    />

                    {/* Block / Unblock Toggle */}
                    <Popconfirm
                      open={getEmpId(blockConfirmEmployee) === getEmpId(emp)}
                      onOpenChange={(open) => !open && setBlockConfirmEmployee(null)}
                      title={emp.isActive === false ? 'Unblock User?' : 'Block User?'}
                      description={
                        emp.isActive === false
                          ? 'This user will regain access to the system.'
                          : 'This user will no longer be able to access the system.'
                      }
                      onConfirm={() => handleBlockConfirm(emp)}
                      okText={emp.isActive === false ? 'Unblock' : 'Block'}
                      cancelText='Cancel'
                      okButtonProps={{
                        className:
                          emp.isActive === false
                            ? '!bg-green-500 hover:!bg-green-600'
                            : '!bg-red-500 hover:!bg-red-600',
                      }}
                    >
                      <Switch
                        checked={emp.isActive ?? true}
                        disabled={blockMutation.isPending}
                        onChange={() => setBlockConfirmEmployee(emp)}
                      />
                    </Popconfirm>
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
                    disabled={emp.isActive === false || deleteMutation.isPending}
                    onClick={() => setModal({ type: 'edit', user: emp })}
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
                    disabled={
                      emp.isActive === false ||
                      (deleteMutation.isPending && deleteMutation.variables === getEmpId(emp))
                    }
                    onClick={() => setModal({ type: 'delete', user: emp })}
                    size='small'
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#EF4444',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      '&:hover': { bgcolor: '#F3F4F6' },
                    }}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === getEmpId(emp) ? (
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

      <AddModal
        open={addModalOpen}
        onClose={() => setModal(null)}
        editing={editing}
        onSuccess={() => setModal(null)}
      />

      <DeleteModal
        open={deleteModalOpen}
        onClose={() => setModal(null)}
        title='Delete Employee?'
        entityName={selectedEmployee?.name}
        confirmId={getEmpId(selectedEmployee)}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </Box>
  );
}
