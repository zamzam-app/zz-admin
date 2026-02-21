/** Response from GET /api/upload/signature (backend signed params for Cloudinary) */
export interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

/** Response from Cloudinary after uploading an image */
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}
