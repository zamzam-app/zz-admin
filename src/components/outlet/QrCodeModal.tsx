import { Download, ExternalLink } from 'lucide-react';
import QRCode from 'react-qr-code';
import type { Outlet } from '../../lib/types/outlet';
import { downloadQrFromSvg } from '../../lib/utils/downloadQrFromSvg';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const userBaseUrl = import.meta.env.VITE_USER_BASE_URL ?? baseUrl;

export type QrCodeModalProps = {
  open: boolean;
  onClose: () => void;
  store: Outlet | null;
};

type QrCodeData = {
  id: string;
  name: string;
  url: string;
};

export function QrCodeModal({ open, onClose, store }: QrCodeModalProps) {
  const slug = store?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'outlet';
  const reviewUrl = store?.qrToken ? `${userBaseUrl}/review/${store.qrToken}` : '';
  const menuUrl = store?.qrToken ? `${userBaseUrl}/menu/${store.qrToken}` : '';

  const openInNewTab = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const data: QrCodeData[] = [
    { name: 'Scan to access review page', url: reviewUrl, id: 'review' },
    { name: 'Scan to access menu page', url: menuUrl, id: 'menu' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={store?.name || 'Outlet QR Code'}
      maxWidth='xl'
      className='text-center'
    >
      <div className='flex flex-row items-start justify-center gap-12 p-6'>
        {data.map((item) => (
          <div key={item.id} className='flex flex-col items-center flex-1 min-w-0'>
            <div className='bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-3'>
              {store?.qrToken && (
                <QRCode id={`qr-code-${item.id}-svg`} value={item.url} size={200} />
              )}
            </div>
            <p className='text-gray-500 text-sm mb-1'>{item.name}</p>
            <code className='bg-gray-100 px-3 py-1 rounded text-xs text-gray-600 break-all select-all mb-4 block w-full text-center truncate'>
              {item.url || '—'}
            </code>
            <div className='flex flex-row gap-2 justify-center'>
              <Button
                variant='outline'
                onClick={() =>
                  downloadQrFromSvg(`qr-code-${item.id}-svg`, `${slug}-${item.id}-qr.png`)
                }
              >
                <Download size={16} />
              </Button>
              <Button variant='outline' onClick={() => openInNewTab(item.url)} disabled={!item.url}>
                <ExternalLink size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
