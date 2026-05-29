import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@ext/schemas';
import type { RegisterInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { DateBirthPicker } from '@/components/ui/date-birth-picker';
import { useRegister } from '../api/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    registerUser(data, {
      onSuccess: () => {
        toast.success('Compte créé avec succès !');
        navigate('/login');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Échec de la création du compte';
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
          <FieldContent>
            <Input
              id="firstName"
              placeholder="John"
              required
              {...register('firstName')}
            />
          </FieldContent>
          <FieldError errors={[errors.firstName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="lastName">Nom</FieldLabel>
          <FieldContent>
            <Input
              id="lastName"
              placeholder="Doe"
              required
              {...register('lastName')}
            />
          </FieldContent>
          <FieldError errors={[errors.lastName]} />
        </Field>
      </div>

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
        <FieldLabel htmlFor="dateOfBirth">Date de naissance</FieldLabel>
        <FieldContent>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <DateBirthPicker
                date={field.value}
                setDate={field.onChange}
                placeholder="Sélectionner une date"
              />
            )}
          />
        </FieldContent>
        <FieldError errors={[errors.dateOfBirth]} />
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
        {isPending ? 'Création du compte...' : 'Créer le compte'}
      </Button>
    </form>
  );
};
