import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdMembers,
  getHouseholdMember,
  addHouseholdMember,
  updateHouseholdMember,
  removeHouseholdMember,
} from './fetchers';

export const useHouseholdMembers = () => {
    return useQuery({
        queryKey: ['household'],
        queryFn: getHouseholdMembers,
    });
};

export const useHouseholdMember = (id: string) => {
    return useQuery({
        queryKey: ['household', id],
        queryFn: () => getHouseholdMember(id),
        enabled: !!id,
    });
};

export const useAddHouseholdMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addHouseholdMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['household'] });
        },
    });
};

export const useUpdateHouseholdMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateHouseholdMember,
        onSuccess: (data) => {
             queryClient.invalidateQueries({ queryKey: ['household'] });
             queryClient.invalidateQueries({ queryKey: ['household', data.id] });
        },
    });
};

export const useRemoveHouseholdMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeHouseholdMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['household'] });
        },
    });
};
