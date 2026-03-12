import { Copy, Download, ExternalLink } from 'lucide-react';
import QRCode from 'react-qr-code';
import type { Outlet } from '../../lib/types/outlet';
import { userBaseUrl } from '../../lib/config/userBaseUrl';
import { downloadQrFromSvg } from '../../lib/utils/downloadQrFromSvg';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export type QrCodeModalProps = {
  open: boolean;
  onClose: () => void;
  store: Outlet | null;
  titleOverride?: string;
  urlOverride?: string;
};

type QrCodeData = {
  id: string;
  name: string;
  url: string;
};

export function QrCodeModal({
  open,
  onClose,
  store,
  titleOverride,
  urlOverride,
}: QrCodeModalProps) {
  const slug = store?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'outlet';
  const reviewUrl = urlOverride || (store?.qrToken ? `${userBaseUrl}/review/${store.qrToken}` : '');

  const openInNewTab = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyReviewUrl = async (url: string) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
  };

  const data: QrCodeData[] = [{ name: 'Scan to access review page', url: reviewUrl, id: 'review' }];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleOverride || store?.name || 'Outlet QR Code'}
      maxWidth='sm'
      className='text-center'
    >
      <div className='flex flex-row items-start justify-center gap-12 p-6'>
        {data.map((item) => (
          <div key={item.id} className='flex flex-col items-center flex-1 min-w-0'>
            <div className='bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-3'>
              {(urlOverride || store?.qrToken) && (
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
                onClick={() => copyReviewUrl(item.url)}
                disabled={!item.url}
                title='Copy review URL'
              >
                <Copy size={16} />
              </Button>
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
