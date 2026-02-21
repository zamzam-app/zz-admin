import api from './axios';
import { UPLOAD } from './endpoints';
import type { SignatureResponse } from '../../types/upload';

/**
 * Fetches signed upload params from the backend for Cloudinary.
 * Uses the same auth as other API calls (Bearer token via axios interceptor).
 */
export async function getUploadSignature(folder?: string): Promise<SignatureResponse> {
  const { data } = await api.get<SignatureResponse>(UPLOAD.SIGNATURE, {
    params: folder ? { folder } : undefined,
  });
  return data;
}
