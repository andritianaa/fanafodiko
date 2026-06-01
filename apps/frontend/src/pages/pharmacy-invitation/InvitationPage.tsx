import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvitation, useAcceptInvitation } from '@/features/myPharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StorefrontIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  admin: 'administrateur',
  staff: 'membre du staff',
};

export default function InvitationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { data: invitation, isLoading, isError } = useInvitation(token);
  const { mutate: accept, isPending } = useAcceptInvitation();

  const isAuthed = !!localStorage.getItem('auth');

  const handleAccept = () => {
    accept(token, {
      onSuccess: ({ pharmacyId }) => {
        toast.success('Invitation acceptée !');
        navigate(`/my-pharmacy/${pharmacyId}`);
      },
      onError: (e: any) =>
        toast.error(e.response?.data?.message || "Échec de l'acceptation"),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <StorefrontIcon size={40} weight="duotone" className="text-primary" />
          </div>
          <CardTitle>Invitation à gérer une pharmacie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <Skeleton className="h-24 w-full" />}

          {isError && (
            <p className="text-center text-destructive text-sm">
              Cette invitation est introuvable ou a expiré.
            </p>
          )}

          {invitation && (
            <>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold">{invitation.pharmacyName}</p>
                <p className="text-sm text-muted-foreground">
                  Rôle proposé :{' '}
                  <strong>{ROLE_LABELS[invitation.role] ?? invitation.role}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Pour : {invitation.email}
                </p>
              </div>

              {invitation.status !== 'pending' ? (
                <p className="text-center text-sm text-amber-600">
                  Cette invitation a déjà été{' '}
                  {invitation.status === 'accepted' ? 'acceptée' : 'expirée'}.
                </p>
              ) : !isAuthed ? (
                <div className="space-y-2">
                  <p className="text-center text-sm text-muted-foreground">
                    Connectez-vous avec l'adresse <strong>{invitation.email}</strong>{' '}
                    pour accepter.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/login?redirect=/pharmacy-invitation/${token}`}>
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register">Créer un compte</Link>
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAccept} disabled={isPending} className="w-full">
                  {isPending ? 'Acceptation…' : "Accepter l'invitation"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
