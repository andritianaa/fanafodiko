import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequestPasswordResetSchema } from '@ext/schemas';
import type { RequestPasswordResetInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { useRequestPasswordReset } from '../api/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthResetStore } from '../store/auth-reset-store';

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const setResetEmail = useAuthResetStore((state) => state.setResetEmail);
  const { mutate: requestReset, isPending } = useRequestPasswordReset();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(RequestPasswordResetSchema),
  });

  const onSubmit = (data: RequestPasswordResetInput) => {
    requestReset(data, {
      onSuccess: () => {
        setResetEmail(data.email);
        toast.success('Code de réinitialisation envoyé !');
        navigate('/reset-password');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || error.message || 'Échec de la demande');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldContent>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register('email')}
          />
        </FieldContent>
        <FieldError errors={[errors.email]} />
      </Field>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Envoi en cours...' : 'Envoyer le lien'}
      </Button>
    </form>
  );
};
