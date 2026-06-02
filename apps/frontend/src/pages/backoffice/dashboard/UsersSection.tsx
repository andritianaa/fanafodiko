import { useBackofficeUsers } from '@/features/backoffice/api/hooks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BackofficeUser } from '@ext/schemas';

const ROLE_LABELS: Record<BackofficeUser['role'], string> = {
  user: 'Utilisateur',
  admin: 'Administrateur',
  support: 'Support',
};
const ROLE_VARIANTS: Record<BackofficeUser['role'], 'default' | 'secondary' | 'destructive'> = {
  user: 'secondary',
  admin: 'default',
  support: 'destructive',
};

export default function UsersSection() {
  const { data, isLoading, isError } = useBackofficeUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Utilisateurs</span>
          {data && <Badge variant="secondary">{data.total} au total</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <p className="text-destructive text-sm">Impossible de charger les utilisateurs.</p>
        )}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 pr-4 font-medium">Email</th>
                  <th className="text-left py-3 pr-4 font-medium">Rôle</th>
                  <th className="text-left py-3 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3 pr-4 font-mono">{user.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={ROLE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
