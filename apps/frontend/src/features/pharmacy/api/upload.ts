import { apiClient } from '@/api/client';

export interface UploadResult {
  filename: string;
  url: string;
}

/** Upload une image vers /files/upload (auth requise). Retourne l'URL publique. */
export const uploadImage = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<UploadResult>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
