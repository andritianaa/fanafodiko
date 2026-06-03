import { useState } from 'react';
import {
  usePharmacyRequests,
  useApproveRequest,
  useRejectRequest,
  useReviewManagement,
  useDeleteRequest,
} from '@/features/pharmacyRequest/api/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckIcon,
  XIcon,
  ShieldCheckIcon,
  CaretDownIcon,
  CaretUpIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { PharmacyRequest } from '@ext/schemas';

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  approved: { label: 'Approuvée', variant: 'default' },
  rejected: { label: 'Refusée', variant: 'destructive' },
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// ─── Card détaillée ───────────────────────────────────────────────────────────

function RequestCard({ request }: { request: PharmacyRequest }) {
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();
  const { mutate: reviewMgmt, isPending: reviewing } = useReviewManagement();
  const { mutate: deleteReq, isPending: deleting } = useDeleteRequest();

  const [expanded, setExpanded] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const p = request.payload;
  const status = STATUS_BADGE[request.status];

  const handleApprove = () =>
    approve(request.id, {
      onSuccess: () => toast.success('Pharmacie créée et publiée'),
      onError: () => toast.error("Erreur lors de l'approbation"),
    });

  const handleReject = () => {
    reject(
      { reqId: request.id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success('Demande refusée');
          setRejectDialogOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur lors du refus'),
      }
    );
  };

  const handleManagement = (decision: 'approve' | 'reject') =>
    reviewMgmt(
      { reqId: request.id, decision },
      {
        onSuccess: () =>
          toast.success(decision === 'approve' ? 'Gestion accordée' : 'Gestion refusée'),
        onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
      }
    );

  const sortedHours = [...(p.openingHours ?? [])].sort((a, b) => a.day - b.day);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* ── En-tête ── */}
          <div className="px-4 pt-4 pb-3 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-0.5">
                <p className="font-semibold text-base">{p.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPinIcon size={12} weight="fill" />
                  {p.address}, {p.city}
                  {p.region ? `, ${p.region}` : ''}
                </p>
                {p.landmark && (
                  <p className="text-xs text-muted-foreground italic">{p.landmark}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Soumis par{' '}
                  <span className="font-medium">{request.submittedByEmail}</span>
                  {' · '}
                  {format(new Date(request.createdAt), 'd MMM yyyy', { locale: fr })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={status.variant}>{status.label}</Badge>
                {request.wantsToManage && (
                  <Badge variant="outline" className="text-violet-600 border-violet-300 text-xs">
                    Demande de gestion
                  </Badge>
                )}
              </div>
            </div>

            {/* Raison de refus */}
            {request.status === 'rejected' && (request as any).rejectionReason && (
              <p className="text-xs bg-red-50 border border-red-200 rounded-md px-3 py-2 text-red-700">
                Motif : {(request as any).rejectionReason}
              </p>
            )}
          </div>

          {/* ── Détails dépliables ── */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 border-t transition-colors"
              >
                <span>{expanded ? 'Masquer les détails' : 'Voir tous les détails'}</span>
                {expanded ? <CaretUpIcon size={14} /> : <CaretDownIcon size={14} />}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-4 pb-4 pt-2 space-y-4 border-t bg-muted/10">

                {/* Coordonnées GPS */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Position GPS
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {p.coordinates.lat.toFixed(6)}, {p.coordinates.lng.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${p.coordinates.lat},${p.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline mt-0.5 inline-block"
                  >
                    Voir sur Google Maps ↗
                  </a>
                </div>

                {/* Contacts */}
                {p.contacts && p.contacts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Contacts
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {p.contacts.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs bg-background border rounded-full px-2.5 py-1"
                        >
                          <PhoneIcon size={11} />
                          {c.label ? `${c.label}: ` : ''}
                          {c.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Horaires */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <ClockIcon size={12} /> Horaires
                  </p>
                  {p.isOpen24h ? (
                    <p className="text-xs text-sky-600 font-semibold">Ouvert 24h/24</p>
                  ) : sortedHours.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      {sortedHours.map((h) => (
                        <div key={h.day} className="flex justify-between text-xs">
                          <span className="text-muted-foreground w-8 shrink-0">{DAYS[h.day]}</span>
                          {h.isClosed ? (
                            <span className="text-destructive">Fermé</span>
                          ) : (
                            <span className="font-medium">{h.open}–{h.close}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Non renseigné</p>
                  )}
                </div>

                {/* Justificatifs (si gestion demandée) */}
                {request.wantsToManage && request.proofImages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Justificatifs ({request.proofImages.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto">
                      {request.proofImages.map((url) => (
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
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* ── Bouton supprimer (toujours visible) ── */}
          <div className="px-4 pb-1 flex justify-end">
            <Button
              size="xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon size={13} />
              Supprimer
            </Button>
          </div>

          {/* ── Actions ── */}
          <div className="px-4 pb-4 space-y-2">
            {/* Actions pharmacie (en attente) */}
            {request.status === 'pending' && (
              <div className="flex gap-2 pt-2">
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
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={rejecting}
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 flex-1"
                >
                  <XIcon size={14} /> Refuser
                </Button>
              </div>
            )}

            {/* Actions gestion */}
            {request.status === 'approved' &&
              request.wantsToManage &&
              request.managementStatus === 'pending' && (
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <span className="text-sm text-muted-foreground self-center mr-auto">
                    Demande de gestion en attente :
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleManagement('approve')}
                    disabled={reviewing}
                    className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                  >
                    <ShieldCheckIcon size={14} /> Accorder la gestion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagement('reject')}
                    disabled={reviewing}
                    className="text-red-600"
                  >
                    Refuser la gestion
                  </Button>
                </div>
              )}

            {request.managementStatus === 'approved' && (
              <p className="text-xs text-violet-600 border-t pt-2">
                ✅ Gestion accordée au demandeur (superadmin)
              </p>
            )}
            {request.managementStatus === 'rejected' && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                ✗ Gestion refusée
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog confirmation suppression ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La demande de <strong>{p.name}</strong> soumise par{' '}
              <strong>{request.submittedByEmail}</strong> sera définitivement
              supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() =>
                deleteReq(request.id, {
                  onSuccess: () => toast.success('Demande supprimée'),
                  onError: () => toast.error('Erreur lors de la suppression'),
                })
              }
              disabled={deleting}
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog refus avec motif ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Demande de <strong>{p.name}</strong> soumise par {request.submittedByEmail}.
              Un e-mail de notification sera envoyé à l'auteur.
            </p>
            <div className="space-y-1.5">
              <Label>Motif de refus <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                placeholder="ex: Informations insuffisantes, localisation imprécise…"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
            >
              {rejecting ? 'Refus en cours…' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Onglet principal ─────────────────────────────────────────────────────────

export function RequestsTab() {
  const { data, isLoading } = usePharmacyRequests();
  const requests = data?.requests ?? [];
  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Aucune demande de pharmacie pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            En attente
            <Badge variant="secondary">{pending.length}</Badge>
          </h3>
          {pending.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Traitées ({others.length})
          </h3>
          {others.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
