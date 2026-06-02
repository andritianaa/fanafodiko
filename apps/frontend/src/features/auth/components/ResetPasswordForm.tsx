import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfirmPasswordResetSchema } from '@ext/schemas';
import type { ConfirmPasswordResetInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { useConfirmPasswordReset } from '../api/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthResetStore } from '../store/auth-reset-store';

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const resetEmail = useAuthResetStore((state) => state.resetEmail);
  const { mutate: confirmReset, isPending } = useConfirmPasswordReset();
  
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<ConfirmPasswordResetInput>({
    resolver: zodResolver(ConfirmPasswordResetSchema),
    defaultValues: {
      code: '',
      newPassword: '',
    },
  });

  const onSubmit = (data: ConfirmPasswordResetInput) => {
    confirmReset(data, {
      onSuccess: () => {
        toast.success('Le mot de passe a été réinitialisé avec succès.');
        navigate('/login');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || error.message || 'Échec de la réinitialisation');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {resetEmail && (
        <p className="text-sm text-muted-foreground text-center">
          Code envoyé à <span className="font-medium text-foreground">{resetEmail}</span>
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="code">Code de réinitialisation</FieldLabel>
        <FieldContent>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSeparator />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSeparator />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        </FieldContent>
        <FieldError errors={[errors.code]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
        <FieldContent>
          <Input
            id="newPassword"
            type="password"
            placeholder="Minimum 8 caractères"
            {...register('newPassword')}
          />
        </FieldContent>
        <FieldError errors={[errors.newPassword]} />
      </Field>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
      </Button>
    </form>
  );
};
