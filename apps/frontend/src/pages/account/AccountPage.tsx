import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChangePasswordSchema, ChangeEmailSchema } from '@ext/schemas'
import type { ChangePasswordInput, ChangeEmailInput } from '@/features/auth/types'
import { useChangePassword, useChangeEmail, useMe } from '@/features/auth/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFontSize, FONT_SIZE_OPTIONS, type FontSize } from '@/contexts/FontSizeContext'
import { toast } from 'sonner'

export default function AccountPage() {
  const { data: user } = useMe()
  const { fontSize, setFontSize } = useFontSize()
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const { mutate: doChangePassword, isPending: changingPassword } = useChangePassword()
  const { mutate: doChangeEmail, isPending: changingEmail } = useChangeEmail()

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  })

  const emailForm = useForm<ChangeEmailInput>({
    resolver: zodResolver(ChangeEmailSchema),
  })

  const onChangePassword = (data: ChangePasswordInput) => {
    doChangePassword(data, {
      onSuccess: () => {
        toast.success('Mot de passe modifié')
        passwordForm.reset()
        setPasswordSuccess(true)
        setTimeout(() => setPasswordSuccess(false), 3000)
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Erreur lors du changement de mot de passe'
        passwordForm.setError('currentPassword', { message: msg })
      },
    })
  }

  const onChangeEmail = (data: ChangeEmailInput) => {
    doChangeEmail(data, {
      onSuccess: (res) => {
        toast.success(`Email modifié : ${res.email}`)
        emailForm.reset()
        setEmailSuccess(true)
        setTimeout(() => setEmailSuccess(false), 3000)
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || 'Erreur lors du changement d\'email'
        emailForm.setError('currentPassword', { message: msg })
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos informations et préférences</p>
      </div>

      {/* Current account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium">{user?.email?.toString() || '—'}</p>
              <p className="text-xs text-muted-foreground">Adresse email actuelle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifier l'adresse email</CardTitle>
          <CardDescription>Votre mot de passe est requis pour confirmer ce changement.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="newEmail">Nouvel email</FieldLabel>
              <FieldContent>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="nouveau@exemple.com"
                  autoComplete="off"
                  {...emailForm.register('newEmail')}
                />
              </FieldContent>
              <FieldError errors={[emailForm.formState.errors.newEmail]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="emailCurrentPassword">Mot de passe actuel</FieldLabel>
              <FieldContent>
                <Input
                  id="emailCurrentPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...emailForm.register('currentPassword')}
                />
              </FieldContent>
              <FieldError errors={[emailForm.formState.errors.currentPassword]} />
            </Field>

            <Button type="submit" disabled={changingEmail} variant={emailSuccess ? 'outline' : 'default'}>
              {changingEmail ? 'Modification…' : emailSuccess ? 'Email modifié ✓' : 'Modifier l\'email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifier le mot de passe</CardTitle>
          <CardDescription>Choisissez un mot de passe d'au moins 8 caractères.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
              <FieldContent>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...passwordForm.register('currentPassword')}
                />
              </FieldContent>
              <FieldError errors={[passwordForm.formState.errors.currentPassword]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
              <FieldContent>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                />
              </FieldContent>
              <FieldError errors={[passwordForm.formState.errors.newPassword]} />
            </Field>

            <Button type="submit" disabled={changingPassword} variant={passwordSuccess ? 'outline' : 'default'}>
              {changingPassword ? 'Modification…' : passwordSuccess ? 'Mot de passe modifié ✓' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Font size preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Préférences d'affichage</CardTitle>
          <CardDescription>Ajustez la taille du texte et des icônes dans toute l'application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm font-medium">Taille de police</p>
            <div className="flex gap-3">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFontSize(opt.value as FontSize)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
                    fontSize === opt.value
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  <span
                    className="block font-bold mb-1"
                    style={{
                      fontSize: opt.value === 'sm' ? '13px' : opt.value === 'md' ? '16px' : '20px',
                    }}
                  >
                    Aa
                  </span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
