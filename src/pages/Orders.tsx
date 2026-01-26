import React, { useState } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

interface Order {
  id: string;
  customerName: string;
  items: string;
  total: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  date: string;
}

const initialOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'Alice Johnson',
    items: 'Vanilla Dream (x1)',
    total: 45,
    status: 'Pending',
    date: '2024-01-25',
  },
  {
    id: 'ORD-002',
    customerName: 'Bob Smith',
    items: 'Chocolate Bliss (x2)',
    total: 110,
    status: 'Completed',
    date: '2024-01-24',
  },
  {
    id: 'ORD-003',
    customerName: 'Charlie Brown',
    items: 'Red Velvet (x1)',
    total: 50,
    status: 'Cancelled',
    date: '2024-01-23',
  },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customerName: '',
    items: '',
    total: 0,
    status: 'Pending',
  });

  const handleDelete = (id: string) => {
    setOrders(orders.filter((order) => order.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.items || !newOrder.total) return;

    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 1000)}`,
      customerName: newOrder.customerName,
      items: newOrder.items,
      total: newOrder.total,
      status: (newOrder.status as 'Pending' | 'Completed' | 'Cancelled') || 'Pending',
      date: new Date().toISOString().split('T')[0],
    };

    setOrders([order, ...orders]);
    setIsModalOpen(false);
    setNewOrder({ customerName: '', items: '', total: 0, status: 'Pending' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600';
      case 'Pending':
        return 'bg-amber-50 text-amber-600';
      case 'Cancelled':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h3 className='font-black text-3xl text-[#1F2937] tracking-tight'>Order Management</h3>
          <p className='text-gray-500 text-sm mt-1'>View and manage customer orders</p>
        </div>
        <Button
          variant='admin-primary'
          onClick={() => setIsModalOpen(true)}
          className='rounded-2xl py-4 shadow-xl shadow-gray-900/10'
        >
          <div className='flex items-center gap-2'>
            <Plus size={20} /> Create Manual Order
          </div>
        </Button>
      </div>

      <div className='bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden'>
        <table className='w-full text-left'>
          <thead className='bg-[#F9FAFB] text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]'>
            <tr>
              <th className='px-8 py-6'>Order ID</th>
              <th className='px-8 py-6'>Customer</th>
              <th className='px-8 py-6'>Items</th>
              <th className='px-8 py-6 text-center'>Date</th>
              <th className='px-8 py-6 text-center'>Status</th>
              <th className='px-8 py-6 text-center'>Total</th>
              <th className='px-8 py-6 text-right'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-50 text-[#1F2937]'>
            {orders.map((order) => (
              <tr key={order.id} className='hover:bg-[#F9FAFB]/50 transition-colors'>
                <td className='px-8 py-6 font-bold text-gray-500'>{order.id}</td>
                <td className='px-8 py-6 font-bold'>{order.customerName}</td>
                <td className='px-8 py-6 text-sm text-gray-600'>{order.items}</td>
                <td className='px-8 py-6 text-center text-sm text-gray-500'>{order.date}</td>
                <td className='px-8 py-6 text-center'>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg font-black text-xs uppercase tracking-wider ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className='px-8 py-6 text-center font-black'>${order.total}</td>
                <td className='px-8 py-6 text-right'>
                  <div className='flex justify-end gap-2'>
                    {/* Placeholder for view details */}
                    <button className='p-3 text-gray-400 hover:text-[#D4AF37] hover:bg-white rounded-xl transition-all cursor-pointer'>
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className='p-3 text-gray-400 hover:text-[#E11D48] hover:bg-white rounded-xl transition-all cursor-pointer'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-[32px] w-full max-w-lg p-10 max-h-[90vh] overflow-y-auto shadow-2xl'>
            <h3 className='text-2xl font-black mb-2 text-[#1F2937]'>New Manual Order</h3>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <Input
                label='Customer Name'
                value={newOrder.customerName || ''}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                required
              />
              <Input
                label='Items (Description)'
                value={newOrder.items || ''}
                onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                required
              />
              <div className='grid grid-cols-2 gap-6'>
                <Input
                  label='Total Amount ($)'
                  type='number'
                  value={newOrder.total || ''}
                  onChange={(e) => setNewOrder({ ...newOrder, total: Number(e.target.value) })}
                  required
                />
                <Select
                  label='Status'
                  options={['Pending', 'Completed', 'Cancelled']}
                  value={newOrder.status}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      status: e.target.value as 'Pending' | 'Completed' | 'Cancelled',
                    })
                  }
                />
              </div>
              <div className='flex justify-end gap-4 pt-4'>
                <Button type='button' variant='ghost' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' variant='admin-primary' className='rounded-2xl px-10'>
                  Create Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
