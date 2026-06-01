import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon,
  XCircleIcon,
  PillIcon,
  BellRingingIcon,
} from '@phosphor-icons/react';
import { usePharmacyPendingSearches, useRespondToSearch } from '@/features/medSearch/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  pharmacyId: string;
}

export function PharmacySearchAlert({ pharmacyId }: Props) {
  const { data: pending = [] } = usePharmacyPendingSearches(pharmacyId);
  const { mutate: respond, isPending } = useRespondToSearch();
  const qc = useQueryClient();

  // Affiche la demande la plus récente en priorité
  const search = pending[0] ?? null;

  const handleRespond = (hasStock: boolean) => {
    if (!search) return;
    respond(
      { searchId: search.searchId, pharmacyId, data: { hasStock } },
      {
        onSuccess: () => {
          toast.success(hasStock ? 'Disponibilité confirmée,le patient est notifié' : 'Réponse envoyée');
          qc.invalidateQueries({ queryKey: ['pharmacy-pending-searches', pharmacyId] });
        },
        onError: () => toast.error('Erreur lors de la réponse'),
      }
    );
  };

  if (!search) return null;

  const ageLabel = formatDistanceToNow(new Date(search.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    // Backdrop,seule une réponse ferme le dialog
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <BellRingingIcon size={22} weight="fill" className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary-foreground/70 font-medium uppercase tracking-wider">
              Demande de médicament
            </p>
            <p className="text-white text-xs mt-0.5">{ageLabel}</p>
          </div>
        </div>

        <div className="px-5 py-5">
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
            <div className="bg-muted/60 rounded-lg px-3 py-2.5 mb-5">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Note du patient</p>
              <p className="text-sm italic">"{search.note}"</p>
            </div>
          )}

          {pending.length > 1 && (
            <p className="text-xs text-muted-foreground text-center mb-4">
              +{pending.length - 1} autre{pending.length > 2 ? 's' : ''} demande{pending.length > 2 ? 's' : ''} en attente
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-14 gap-2 text-base bg-green-600 hover:bg-green-700"
              onClick={() => handleRespond(true)}
              disabled={isPending}
            >
              <CheckCircleIcon size={20} weight="fill" />
              Disponible
            </Button>
            <Button
              variant="destructive"
              className="h-14 gap-2 text-base"
              onClick={() => handleRespond(false)}
              disabled={isPending}
            >
              <XCircleIcon size={20} weight="fill" />
              Indisponible
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
