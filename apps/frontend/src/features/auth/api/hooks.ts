import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  login,
  register,
  logout,
  getMe,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  changeEmail,
} from './fetchers';

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: login,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: register,
    });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });
};

export const useRequestPasswordReset = () => {
    return useMutation({
        mutationFn: requestPasswordReset
    });
}

export const useConfirmPasswordReset = () => {
    return useMutation({
        mutationFn: confirmPasswordReset
    });
}

export const useChangePassword = () => {
  return useMutation({ mutationFn: changePassword });
};

export const useChangeEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
