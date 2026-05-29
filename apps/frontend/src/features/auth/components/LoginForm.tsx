import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@ext/schemas';
import type { LoginInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { useLogin } from '../api/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => {
        toast.success('Connexion réussie');
        navigate('/dashboard');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Échec de la connexion';
        toast.error(message);
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

      <Field>
        <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
        <FieldContent>
          <Input
            id="password"
            type="password"
            {...register('password')}
          />
        </FieldContent>
        <FieldError errors={[errors.password]} />
      </Field>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Connexion en cours...' : 'Se connecter'}
      </Button>
    </form>
  );
};
