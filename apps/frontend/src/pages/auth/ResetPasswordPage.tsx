import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const ResetPasswordPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-background/60 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Saisissez le code à 6 chiffres reçu par email et votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetPasswordForm />
          <div className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline font-medium">
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
