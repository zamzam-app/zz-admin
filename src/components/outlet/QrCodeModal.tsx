import { Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import type { Outlet } from '../../lib/types/outlet';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export type QrCodeModalProps = {
  open: boolean;
  onClose: () => void;
  store: Outlet | null;
};

export function QrCodeModal({ open, onClose, store }: QrCodeModalProps) {
  const handleDownloadQr = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg || !store?.qrToken) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');

        const downloadLink = document.createElement('a');
        downloadLink.download = `${store.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={store?.name || 'Outlet QR Code'}
      className='text-center'
    >
      <div className='flex flex-col items-center justify-center p-4'>
        <div className='bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-6'>
          {store?.qrToken && (
            <QRCode
              id='qr-code-svg'
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/r/${store.qrToken}`}
              size={200}
            />
          )}
        </div>

        <p className='text-gray-500 text-sm mb-2'>Scan to access review page</p>
        <code className='bg-gray-100 px-3 py-1 rounded text-xs text-gray-600 break-all select-all mb-6 block'>
          {store?.qrToken
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${store.qrToken}`
            : ''}
        </code>

        <Button onClick={handleDownloadQr} variant='admin-primary'>
          <Download size={16} className='mr-2' /> Download QR Code
        </Button>
      </div>
    </Modal>
  );
}
