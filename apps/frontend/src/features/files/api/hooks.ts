import { useMutation } from '@tanstack/react-query';
import { uploadImage } from './fetchers';

export const useUploadImage = () => {
  return useMutation({
    mutationFn: uploadImage,
  });
};
