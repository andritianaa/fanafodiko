import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { BellIcon } from '@phosphor-icons/react';
import { usePharmacyPendingSearches } from '@/features/medSearch/api/hooks';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  pharmacyId: string;
}

export function PharmacySearchNotifications({ pharmacyId }: Props) {
  const [open, setOpen] = useState(false);
  const { data: pending = [] } = usePharmacyPendingSearches(pharmacyId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <BellIcon size={18} />
          {pending.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold animate-pulse">
              {pending.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold text-sm">Demandes de médicaments</p>
          <p className="text-xs text-muted-foreground">
            {pending.length} en attente de réponse
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {pending.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune demande en attente
            </div>
          ) : (
            pending.map((req) => (
              <div key={req.searchId} className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{req.medicationName}</p>
                    {req.note && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">"{req.note}"</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: fr })}
                      {' · '}{req.radiusKm} km
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">En attente</Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {pending.length > 0 && (
          <>
            <Separator />
            <div className="px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Répondez via le dialog principal</p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
