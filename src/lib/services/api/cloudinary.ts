import type { SignatureResponse } from '../../types/upload';
import type { CloudinaryUploadResult } from '../../types/upload';

/**
 * Uploads a file directly to Cloudinary from the browser using signed params.
 * Does not send the file to your backend.
 */
export async function uploadImageToCloudinary(
  file: File,
  params: SignatureResponse,
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.apiKey);
  formData.append('timestamp', String(params.timestamp));
  formData.append('signature', params.signature);
  formData.append('folder', params.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        res.statusText ||
        'Upload failed',
    );
  }

  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { secure_url: data.secure_url, public_id: data.public_id };
}
