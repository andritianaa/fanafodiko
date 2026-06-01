import { useState } from 'react';
import {
  usePharmacyRequests,
  useApproveRequest,
  useRejectRequest,
  useReviewManagement,
} from '@/features/pharmacyRequest/api/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckIcon, XIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { PharmacyRequest } from '@ext/schemas';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  approved: { label: 'Approuvée', variant: 'default' },
  rejected: { label: 'Refusée', variant: 'destructive' },
};

function RequestCard({ request }: { request: PharmacyRequest }) {
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();
  const { mutate: reviewMgmt, isPending: reviewing } = useReviewManagement();
  const [showProofs, setShowProofs] = useState(false);

  const p = request.payload;
  const status = STATUS_BADGE[request.status];

  const handleApprove = () =>
    approve(request.id, {
      onSuccess: () => toast.success('Pharmacie créée et publiée'),
      onError: () => toast.error('Erreur'),
    });

  const handleReject = () =>
    reject(
      { reqId: request.id, reason: 'Informations insuffisantes' },
      {
        onSuccess: () => toast.success('Demande refusée'),
        onError: () => toast.error('Erreur'),
      }
    );

  const handleManagement = (decision: 'approve' | 'reject') =>
    reviewMgmt(
      { reqId: request.id, decision },
      {
        onSuccess: () =>
          toast.success(
            decision === 'approve' ? 'Gestion accordée' : 'Gestion refusée'
          ),
        onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
      }
    );

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">
              {p.address},{p.city}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Soumis par {request.submittedByEmail}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={status.variant}>{status.label}</Badge>
            {request.wantsToManage && (
              <Badge variant="outline" className="text-violet-600 border-violet-300">
                Demande de gestion
              </Badge>
            )}
          </div>
        </div>

        {/* Justificatifs */}
        {request.wantsToManage && request.proofImages.length > 0 && (
          <div>
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto"
              onClick={() => setShowProofs((s) => !s)}
            >
              {showProofs ? 'Masquer' : 'Voir'} les justificatifs (
              {request.proofImages.length})
            </Button>
            {showProofs && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {request.proofImages.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt="justificatif"
                      className="h-32 w-32 object-cover rounded-lg border shrink-0"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions pharmacie */}
        {request.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approving}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
            >
              <CheckIcon size={14} /> Approuver la pharmacie
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={rejecting}
              className="gap-1.5 text-red-600"
            >
              <XIcon size={14} /> Refuser
            </Button>
          </div>
        )}

        {/* Actions gestion (uniquement si pharmacie approuvée + gestion demandée) */}
        {request.status === 'approved' &&
          request.wantsToManage &&
          request.managementStatus === 'pending' && (
            <div className="flex gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground self-center mr-auto">
                Demande de gestion :
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
                Refuser
              </Button>
            </div>
          )}

        {request.managementStatus === 'approved' && (
          <p className="text-xs text-violet-600 border-t pt-2">
            ✅ Gestion accordée au demandeur (superadmin)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
          <h3 className="text-sm font-medium text-muted-foreground">
            En attente ({pending.length})
          </h3>
          {pending.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Traitées</h3>
          {others.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
