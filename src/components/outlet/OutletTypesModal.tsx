import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data, isLoading } = useApiQuery(
    OUTLET_TYPE_KEYS,
    () => outletTypeApi.getOutletTypes({ page: 1, limit: 100 }),
    { enabled: open },
  );

  const list = data?.data ?? [];
  const columns: ColumnsType<OutletType> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => setAddModalOpen(false)}
        availableForms={availableForms}
        managers={managers}
      />
    </>
  );
}
