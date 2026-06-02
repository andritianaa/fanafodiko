import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { TrashIcon, UserCircleIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PharmacyRole } from '@ext/schemas';
import {
  usePharmacyStaff,
  useBackofficeRemoveMember,
  useBackofficeUpdateMemberRole,
} from '@/features/backoffice/api/hooks';

// ─── Constantes ───────────────────────────────────────────────────────────────

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

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  pharmacyName: string;
}

export function PharmacyStaffDialog({ open, onClose, pharmacyId, pharmacyName }: Props) {
  const { data: members, isLoading } = usePharmacyStaff(pharmacyId);
  const { mutate: removeMember, isPending: removing } = useBackofficeRemoveMember(pharmacyId);
  const { mutate: updateRole } = useBackofficeUpdateMemberRole(pharmacyId);

  const [removeTarget, setRemoveTarget] = useState<{ userId: string; email: string } | null>(null);

  const handleRemove = () => {
    if (!removeTarget) return;
    removeMember(removeTarget.userId, {
      onSuccess: () => {
        toast.success(`${removeTarget.email} retiré(e)`);
        setRemoveTarget(null);
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  const handleRoleChange = (userId: string, email: string, role: PharmacyRole) => {
    updateRole(
      { userId, role },
      {
        onSuccess: () => toast.success(`Rôle de ${email} mis à jour : ${ROLE_LABELS[role]}`),
        onError: () => toast.error('Erreur lors de la mise à jour du rôle'),
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircleIcon size={20} />
              Staff — {pharmacyName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 mt-2">
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ En tant qu'admin de l'application, vous pouvez modifier ou retirer
              n'importe quel membre, y compris les super-admins de pharmacie.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !members || members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Cette pharmacie n'a aucun membre enregistré.
            </p>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {format(new Date(m.createdAt), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>

                  {/* Sélecteur de rôle */}
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      handleRoleChange(m.userId, m.email, v as PharmacyRole)
                    }
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['staff', 'admin', 'superadmin'] as PharmacyRole[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Badge variant={ROLE_VARIANTS[m.role]} className="shrink-0 hidden sm:flex">
                    {ROLE_LABELS[m.role]}
                  </Badge>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => setRemoveTarget({ userId: m.userId, email: m.email })}
                  >
                    <TrashIcon size={15} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.email}</strong> sera retiré de la pharmacie.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? 'Suppression…' : 'Retirer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
