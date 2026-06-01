import { Badge } from '@/components/ui/badge';
import { ShieldIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import type { Pharmacy } from '@ext/schemas';

export function PharmacyStatusBadge({ pharmacy }: { pharmacy: Pharmacy }) {
  if (pharmacy.isOnGuard) {
    return (
      <Badge className="bg-violet-600 hover:bg-violet-700 gap-1">
        <ShieldIcon size={11} weight="fill" /> De Garde
      </Badge>
    );
  }
  if (pharmacy.isOpen24h) {
    return (
      <Badge className="bg-sky-600 hover:bg-sky-700 gap-1">
        <ClockIcon size={11} weight="fill" /> 24h/24
      </Badge>
    );
  }
  if (pharmacy.isOpenNow) {
    return (
      <Badge className="bg-green-600 hover:bg-green-700 gap-1">
        <CheckCircleIcon size={11} weight="fill" /> Ouvert
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircleIcon size={11} weight="fill" /> Fermé
    </Badge>
  );
}
