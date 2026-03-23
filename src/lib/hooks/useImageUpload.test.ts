import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useImageUpload } from './useImageUpload';
import { getUploadSignature } from '../services/api/upload.api';
import { uploadImageToCloudinary } from '../services/api/cloudinary';

vi.mock('../services/api/upload.api', () => ({
  getUploadSignature: vi.fn(),
}));

vi.mock('../services/api/cloudinary', () => ({
  uploadImageToCloudinary: vi.fn(),
}));

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.mocked(getUploadSignature).mockReset();
    vi.mocked(uploadImageToCloudinary).mockReset();
  });

  it('uploads an image and exposes the returned secure url', async () => {
    vi.mocked(getUploadSignature).mockResolvedValue({ signature: 'sig', timestamp: 123 } as never);
    vi.mocked(uploadImageToCloudinary).mockResolvedValue({
      secure_url: 'https://cdn.test/image.png',
    } as never);

    const { result } = renderHook(() => useImageUpload('avatars'));
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });

    let uploadedUrl = '';
    await act(async () => {
      uploadedUrl = await result.current.upload(file);
    });

    expect(uploadedUrl).toBe('https://cdn.test/image.png');
    expect(getUploadSignature).toHaveBeenCalledWith('avatars');
    expect(uploadImageToCloudinary).toHaveBeenCalledWith(file, {
      signature: 'sig',
      timestamp: 123,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('captures upload errors and allows them to be cleared', async () => {
    const error = new Error('Upload failed badly');
    vi.mocked(getUploadSignature).mockRejectedValue(error);
    const { result } = renderHook(() => useImageUpload());

    await expect(
      result.current.upload(new File(['oops'], 'bad.png', { type: 'image/png' })),
    ).rejects.toThrow(error);
    await waitFor(() => expect(result.current.error).toEqual(error));

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
