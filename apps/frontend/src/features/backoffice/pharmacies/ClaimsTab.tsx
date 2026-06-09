import { useState } from 'react';
import { useBackofficeClaims, useApproveClaim, useRejectClaim } from '@/features/pharmacy/api/claimHooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckIcon,
  XIcon,
  CaretDownIcon,
  CaretUpIcon,
  PhoneIcon,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { PharmacyClaim } from '@ext/schemas';

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  approved: { label: 'Approuvée', variant: 'default' },
  rejected: { label: 'Refusée', variant: 'destructive' },
};

function ClaimCard({ claim }: { claim: PharmacyClaim }) {
  const { mutate: approve, isPending: approving } = useApproveClaim();
  const { mutate: reject, isPending: rejecting } = useRejectClaim();

  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const status = STATUS_BADGE[claim.status];

  const handleApprove = () =>
    approve(claim.id, {
      onSuccess: () => toast.success('Réclamation approuvée — le gérant a accès à la pharmacie'),
      onError: (e: any) => toast.error(e.response?.data?.message || "Erreur lors de l'approbation"),
    });

  const handleReject = () =>
    reject(
      { claimId: claim.id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success('Réclamation refusée');
          setRejectOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur lors du refus'),
      }
    );

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="px-4 pt-4 pb-3 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-0.5">
                <p className="font-semibold text-base">{claim.pharmacyName}</p>
                <p className="text-xs text-muted-foreground">
                  Réclamé par <span className="font-medium">{claim.submittedByEmail}</span>
                  {' · '}
                  {format(new Date(claim.createdAt), 'd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <PhoneIcon size={11} /> Contact : {claim.contactInfo}
                </p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {claim.status === 'rejected' && claim.rejectionReason && (
              <p className="text-xs bg-red-50 border border-red-200 rounded-md px-3 py-2 text-red-700">
                Motif : {claim.rejectionReason}
              </p>
            )}
          </div>

          {claim.proofImages.length > 0 && (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 border-t transition-colors"
                >
                  <span>{expanded ? 'Masquer les justificatifs' : `Voir les justificatifs (${claim.proofImages.length})`}</span>
                  {expanded ? <CaretUpIcon size={14} /> : <CaretDownIcon size={14} />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-2 border-t bg-muted/10">
                  <div className="flex gap-2 overflow-x-auto">
                    {claim.proofImages.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="justificatif"
                          className="h-24 w-24 object-cover rounded-lg border shrink-0 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {claim.status === 'pending' && (
            <div className="px-4 pb-4 flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approving}
                className="gap-1.5 bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckIcon size={14} /> Approuver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={rejecting}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 flex-1"
              >
                <XIcon size={14} /> Refuser
              </Button>
            </div>
          )}

          {claim.status === 'approved' && (
            <p className="text-xs text-green-600 px-4 pb-3 border-t pt-2">
              ✅ Gérant (superadmin) accordé
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la réclamation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Réclamation de <strong>{claim.pharmacyName}</strong> par {claim.submittedByEmail}.
              Un e-mail de notification sera envoyé.
            </p>
            <div className="space-y-1.5">
              <Label>Motif <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                placeholder="ex: Justificatifs insuffisants…"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? 'Refus…' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClaimsTab() {
  const { data, isLoading } = useBackofficeClaims();
  const claims = data?.claims ?? [];
  const pending = claims.filter((c) => c.status === 'pending');
  const others = claims.filter((c) => c.status !== 'pending');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Aucune réclamation de pharmacie pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            En attente <Badge variant="secondary">{pending.length}</Badge>
          </h3>
          {pending.map((c) => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Traitées ({others.length})
          </h3>
          {others.map((c) => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}
    </div>
  );
}
