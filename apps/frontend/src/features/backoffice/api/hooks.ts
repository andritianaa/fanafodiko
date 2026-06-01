import { useQuery } from '@tanstack/react-query';
import { getBackofficeUsers } from './fetchers';

export const useBackofficeUsers = () => {
  return useQuery({
    queryKey: ['backoffice', 'users'],
    queryFn: getBackofficeUsers,
  });
};
