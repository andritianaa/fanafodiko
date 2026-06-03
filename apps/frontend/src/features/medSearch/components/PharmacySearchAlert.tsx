import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircleIcon,
  XCircleIcon,
  PillIcon,
  BellRingingIcon,
  HospitalIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { usePharmacyPendingSearches, useRespondToSearch } from '@/features/medSearch/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Pharmacy {
  id: string;
  name: string;
}

interface Props {
  pharmacies: Pharmacy[];
}

/** Hook pour une seule pharmacie, réexporté pour simplifier le composant */
function useAllPendingSearches(pharmacies: Pharmacy[]) {
  const results = pharmacies.map((p) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data = [] } = usePharmacyPendingSearches(p.id);
    return { pharmacy: p, searches: data };
  });
  return results.filter((r) => r.searches.length > 0);
}

export function PharmacySearchAlert({ pharmacies }: Props) {
  const [pharmIndex, setPharmIndex] = useState(0);
  const [respondingWith, setRespondingWith] = useState<boolean | null>(null);
  const { mutate: respond, isPending } = useRespondToSearch();
  const qc = useQueryClient();

  // Toutes les pharmacies qui ont des demandes en attente
  const withPending = useAllPendingSearches(pharmacies);

  // Pharmacie courante parmi celles qui ont des demandes
  const current = withPending[pharmIndex] ?? withPending[0] ?? null;
  const search = current?.searches[0] ?? null;
  const totalPending = withPending.reduce((acc, p) => acc + p.searches.length, 0);

  if (!search || !current) return null;

  const handleRespond = (hasStock: boolean) => {
    setRespondingWith(hasStock);
    respond(
      { searchId: search.searchId, pharmacyId: current.pharmacy.id, data: { hasStock } },
      {
        onSuccess: () => {
          toast.success(
            hasStock
              ? 'Disponibilité confirmée, le patient est notifié'
              : 'Réponse envoyée'
          );
          qc.invalidateQueries({ queryKey: ['pharmacy-pending-searches', current.pharmacy.id] });
          // Passer à la prochaine pharmacie si cette liste est vide après réponse
          const nextIndex = pharmIndex < withPending.length - 1 ? pharmIndex : Math.max(0, pharmIndex - 1);
          setPharmIndex(nextIndex);
          setRespondingWith(null);
        },
        onError: () => {
          toast.error('Erreur lors de la réponse');
          setRespondingWith(null);
        },
      }
    );
  };

  const ageLabel = formatDistanceToNow(new Date(search.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const canGoNext = withPending.length > 1;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête avec nom de pharmacie */}
        <div className="bg-primary px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BellRingingIcon size={22} weight="fill" className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary-foreground/70 font-medium uppercase tracking-wider">
                Demande de médicament
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HospitalIcon size={13} className="text-white/80 shrink-0" weight="fill" />
                <p className="text-white text-sm font-semibold truncate">
                  {current.pharmacy.name}
                </p>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-0.5">{ageLabel}</p>
            </div>

            {/* Navigation pharmacie si plusieurs */}
            {canGoNext && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                  onClick={() => setPharmIndex((i) => (i - 1 + withPending.length) % withPending.length)}
                >
                  <CaretLeftIcon size={14} />
                </button>
                <span className="text-white/70 text-xs font-medium">
                  {pharmIndex + 1}/{withPending.length}
                </span>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                  onClick={() => setPharmIndex((i) => (i + 1) % withPending.length)}
                >
                  <CaretRightIcon size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-5">
          {/* Médicament demandé */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <PillIcon size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{search.medicationName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dans un rayon de {search.radiusKm} km
              </p>
            </div>
          </div>

          {search.note && (
            <div className="bg-muted/60 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-sm italic">"{search.note}"</p>
            </div>
          )}

          {/* Total en attente */}
          {totalPending > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {totalPending} demande{totalPending > 1 ? 's' : ''} en attente
              </Badge>
              {current.searches.length > 1 && (
                <Badge variant="outline" className="text-xs">
                  +{current.searches.length - 1} pour cette pharmacie
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-14 gap-2 text-base bg-green-600 hover:bg-green-700"
              onClick={() => handleRespond(true)}
              loading={isPending && respondingWith === true}
              disabled={isPending && respondingWith !== true}
            >
              {!(isPending && respondingWith === true) && <CheckCircleIcon size={20} weight="fill" />}
              Disponible
            </Button>
            <Button
              variant="destructive"
              className="h-14 gap-2 text-base"
              onClick={() => handleRespond(false)}
              loading={isPending && respondingWith === false}
              disabled={isPending && respondingWith !== false}
            >
              {!(isPending && respondingWith === false) && <XCircleIcon size={20} weight="fill" />}
              Indisponible
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
