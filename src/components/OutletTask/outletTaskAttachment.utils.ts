import type { AttachmentKind } from './outletTaskAttachment.types';

export const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE_LABEL = '50 MB';

export const ACCEPTED_ATTACHMENT_INPUT =
  'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp';

export const KIND_LABEL: Record<AttachmentKind, string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  audio: 'AUDIO',
  pdf: 'PDF',
  doc: 'DOC',
  file: 'FILE',
};

export function mediaNameFromUrl(url: string, fallback: string) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').pop()?.trim();
    return name || fallback;
  } catch {
    return fallback;
  }
}

export function inferAttachmentKind(
  mimeType: string | undefined,
  nameOrUrl: string,
): AttachmentKind {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = nameOrUrl.toLowerCase();

  if (lowerMime.startsWith('image/')) return 'image';
  if (lowerMime.startsWith('video/')) return 'video';
  if (lowerMime.startsWith('audio/')) return 'audio';
  if (lowerMime === 'application/pdf') return 'pdf';
  if (
    lowerMime.includes('msword') ||
    lowerMime.includes('officedocument') ||
    lowerMime.includes('opendocument')
  ) {
    return 'doc';
  }

  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(lowerName)) return 'image';
  if (/\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(lowerName)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|aac|flac|weba|opus|webm)$/i.test(lowerName)) return 'audio';
  if (/\.pdf$/i.test(lowerName)) return 'pdf';
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/i.test(lowerName)) return 'doc';
  return 'file';
}

export function isAllowedAttachmentFile(file: File) {
  const kind = inferAttachmentKind(file.type, file.name);
  return kind === 'image' || kind === 'video' || kind === 'pdf' || kind === 'doc';
}
