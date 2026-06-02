import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import {
  usePharmacyStaff,
  useBackofficeRemoveMember,
  useBackofficeUpdateMemberRole,
} from '@/features/backoffice/api/hooks';
import { useAssignPharmacyOwner } from '@/features/pharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ShieldIcon, TrashIcon, UserCirclePlusIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { PharmacyRole } from '@ext/schemas';
import type { BackofficePharmacyContext } from '../BackofficePharmacyLayout';

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

export default function StaffSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<BackofficePharmacyContext>();

  const { data: members, isLoading } = usePharmacyStaff(id);
  const { mutate: removeMember, isPending: removing } = useBackofficeRemoveMember(id);
  const { mutate: updateRole } = useBackofficeUpdateMemberRole(id);
  const { mutate: assignOwner, isPending: assigning } = useAssignPharmacyOwner();

  const [removeTarget, setRemoveTarget] = useState<{ userId: string; email: string } | null>(null);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);

  const handleRemove = () => {
    if (!removeTarget) return;
    removeMember(removeTarget.userId, {
      onSuccess: () => {
        toast.success(`${removeTarget.email} retiré(e)`);
        setRemoveTarget(null);
      },
      onError: () => toast.error('Erreur'),
    });
  };

  const handleRoleChange = (userId: string, email: string, role: PharmacyRole) => {
    updateRole(
      { userId, role },
      {
        onSuccess: () => toast.success(`Rôle de ${email} : ${ROLE_LABELS[role]}`),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleAssignOwner = () => {
    if (!ownerEmail.trim()) {
      toast.error('Email requis');
      return;
    }
    assignOwner(
      { id, email: ownerEmail.trim() },
      {
        onSuccess: () => {
          toast.success('Super-admin assigné');
          setOwnerEmail('');
          setShowOwnerDialog(false);
        },
        onError: (e: any) =>
          toast.error(e.response?.data?.message || 'Utilisateur introuvable'),
      }
    );
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Bannière admin */}
      <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
        <ShieldIcon size={14} className="mt-0.5 shrink-0" weight="fill" />
        En tant qu'admin de l'application, vous pouvez modifier ou retirer n'importe quel
        membre, y compris les super-admins.
      </div>

      {/* Action : assigner un superadmin */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowOwnerDialog(true)}
        >
          <UserCirclePlusIcon size={14} />
          Assigner un super-admin
        </Button>
      </div>

      {/* Liste membres */}
      {isLoading ? (
        <div className="space-y-2">
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
              </div>

              <Select
                value={m.role}
                onValueChange={(v) => handleRoleChange(m.userId, m.email, v as PharmacyRole)}
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

      {/* Dialog : assigner super-admin */}
      <Dialog open={showOwnerDialog} onOpenChange={(o) => !o && setShowOwnerDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un super-admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Désignez le <strong>super-admin</strong> de <strong>{pharmacy.name}</strong>.
              L'utilisateur doit déjà avoir un compte.
            </p>
            <Input
              type="email"
              placeholder="email@exemple.mg"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignOwner()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOwnerDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignOwner} disabled={assigning}>
              {assigning ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.email}</strong> sera retiré de la pharmacie.
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
    </div>
  );
}
