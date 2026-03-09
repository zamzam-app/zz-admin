import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Table, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { outletTypeApi } from '../../lib/services/api/outlet-type.api';
import { OUTLET_TYPE_KEYS } from '../../lib/types/outlet-type';
import { useApiQuery } from '../../lib/react-query/use-api-hooks';
import type { OutletType } from '../../lib/types/outlet-type';
import type { Form } from '../../lib/types/forms';
import type { ManagerOption } from './OutletModal';
import { AddOutletTypeModal } from './AddOutletTypeModal';

const TABLE_SCROLL_Y = 360;

export type OutletTypesModalProps = {
  open: boolean;
  onClose: () => void;
  availableForms: Form[];
  managers: ManagerOption[];
};

export function OutletTypesModal({
  open,
  onClose,
  availableForms,
  managers,
}: OutletTypesModalProps) {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<OutletType | null>(null);
  const { data, isLoading } = useApiQuery(
    OUTLET_TYPE_KEYS,
    () => outletTypeApi.getOutletTypes({ page: 1, limit: 100 }),
    { enabled: open },
  );

  const list = data?.data ?? [];

  const handleEdit = (record: OutletType) => {
    setEditingType(record);
    setAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await outletTypeApi.delete(id);
      message.success('Outlet type deleted successfully');
      queryClient.invalidateQueries({ queryKey: OUTLET_TYPE_KEYS });
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to delete outlet type');
    }
  };

  const columns: ColumnsType<OutletType> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div className='flex items-center gap-2'>
          <button
            onClick={() => handleEdit(record)}
            className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
          >
            <Edit2 size={16} />
          </button>
          <Popconfirm
            title='Delete Outlet Type'
            description='Are you sure you want to delete this outlet type?'
            onConfirm={() => handleDelete(record._id)}
            okText='Yes'
            cancelText='No'
            okButtonProps={{ danger: true }}
          >
            <button className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'>
              <Trash2 size={16} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title='Outlet Types'
        maxWidth='xl'
        contentClassName='p-6 cursor-default'
        headerAction={
          <Button
            type='button'
            variant='admin-primary'
            className='rounded-2xl'
            onClick={() => setAddModalOpen(true)}
          >
            <Plus size={18} className='mr-2' />
            Add Outlet Type
          </Button>
        }
      >
        <div className='flex flex-col gap-4'>
          <div className='border border-gray-100 rounded-xl overflow-hidden'>
            {isLoading ? (
              <div className='min-h-[200px] flex items-center justify-center'>
                <LoadingSpinner />
              </div>
            ) : (
              <Table<OutletType>
                rowKey='_id'
                columns={columns}
                dataSource={list}
                pagination={false}
                scroll={{ y: TABLE_SCROLL_Y }}
                size='middle'
                locale={{ emptyText: 'No outlet types yet' }}
              />
            )}
          </div>
        </div>
      </Modal>
      <AddOutletTypeModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingType(null);
        }}
        onSuccess={() => {
          setAddModalOpen(false);
          setEditingType(null);
        }}
        availableForms={availableForms}
        managers={managers}
        editing={editingType}
      />
    </>
  );
}
