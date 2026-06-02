import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyPharmacies } from '@/features/myPharmacy/api/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StorefrontIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { PharmacyRole } from '@ext/schemas';

const ROLE_LABELS: Record<PharmacyRole, string> = {
  superadmin: 'Super-admin',
  admin: 'Administrateur',
  staff: 'Staff',
};
const ROLE_VARIANTS: Record<PharmacyRole, 'default' | 'secondary' | 'outline'> = {
  superadmin: 'default',
  admin: 'secondary',
  staff: 'outline',
};

export default function MyPharmacyListPage() {
  const navigate = useNavigate();
  const { data: pharmacies, isLoading } = useMyPharmacies();

  // Redirect directly if only one pharmacy
  useEffect(() => {
    if (!isLoading && pharmacies && pharmacies.length === 1) {
      navigate(`/my-pharmacy/${pharmacies[0].id}`, { replace: true });
    }
  }, [isLoading, pharmacies, navigate]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <StorefrontIcon size={28} weight="duotone" className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Ma pharmacie</h1>
          <p className="text-muted-foreground text-sm">
            Pharmacies que vous gérez
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !pharmacies || pharmacies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Vous ne gérez aucune pharmacie pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pharmacies.map((p) => (
            <Link key={p.id} to={`/my-pharmacy/${p.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ROLE_VARIANTS[p.role]}>
                      {ROLE_LABELS[p.role]}
                    </Badge>
                    <CaretRightIcon size={18} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
