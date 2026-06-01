import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@ext/schemas';
import type { RegisterInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { useRegister, useLogin } from '../api/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();
  const { mutate: loginUser } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    registerUser(data, {
      onSuccess: () => {
        // Auto-connexion immédiate après la création du compte
        loginUser(
          { email: data.email, password: data.password },
          {
            onSuccess: () => {
              toast.success('Compte créé, bienvenue !');
              navigate('/dashboard');
            },
            onError: () => {
              // La création a réussi mais le login a échoué → redirection vers login
              toast.success('Compte créé ! Connectez-vous pour continuer.');
              navigate('/login');
            },
          }
        );
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Échec de la création du compte';
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
        <FieldContent>
          <Input
            id="fullName"
            placeholder="John Doe"
            required
            {...register('fullName')}
          />
        </FieldContent>
        <FieldError errors={[errors.fullName]} />
      </Field>

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

      <p className="text-xs text-center text-gray-500">
        En créant un compte, vous acceptez nos{' '}
        <Link to="/cgu" className="underline hover:text-gray-700" target="_blank" rel="noopener noreferrer">
          Conditions Générales d'Utilisation
        </Link>
        .
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Création du compte...' : 'Créer le compte'}
      </Button>
    </form>
  );
};
