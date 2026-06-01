import { useState } from 'react';
import {
  usePharmacyMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/features/myPharmacy/api/hooks';
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
import { PaperPlaneRightIcon, TrashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { PharmacyRole, PharmacyMember } from '@ext/schemas';

const ROLE_LABELS: Record<PharmacyRole, string> = {
  superadmin: 'Super-admin',
  admin: 'Administrateur',
  staff: 'Staff',
};

interface Props {
  pharmacyId: string;
  myRole: PharmacyRole;
}

export function MembersTab({ pharmacyId, myRole }: Props) {
  const { data: members, isLoading } = usePharmacyMembers(pharmacyId);
  const { mutate: invite, isPending: inviting } = useInviteMember(pharmacyId);
  const { mutate: remove } = useRemoveMember(pharmacyId);
  const { mutate: changeRole } = useUpdateMemberRole(pharmacyId);

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
  const [removeTarget, setRemoveTarget] = useState<PharmacyMember | null>(null);

  const canInvite = myRole === 'admin' || myRole === 'superadmin';
  const canManageRoles = myRole === 'superadmin';

  // Un admin ne peut inviter que des staff ; un superadmin peut inviter admin/staff
  const invitableRoles: ('admin' | 'staff')[] =
    myRole === 'superadmin' ? ['admin', 'staff'] : ['staff'];

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error('Email requis');
      return;
    }
    invite(
      { email: email.trim(), role: inviteRole },
      {
        onSuccess: () => {
          toast.success('Invitation envoyée');
          setEmail('');
        },
        onError: (e: any) =>
          toast.error(e.response?.data?.message || "Échec de l'invitation"),
      }
    );
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    remove(removeTarget.userId, {
      onSuccess: () => {
        toast.success('Membre retiré');
        setRemoveTarget(null);
      },
      onError: (e: any) =>
        toast.error(e.response?.data?.message || 'Erreur'),
    });
  };

  const handleRoleChange = (member: PharmacyMember, role: PharmacyRole) => {
    changeRole(
      { userId: member.userId, role },
      {
        onSuccess: () => toast.success('Rôle mis à jour'),
        onError: (e: any) => toast.error(e.response?.data?.message || 'Erreur'),
      }
    );
  };

  // Un admin peut retirer un staff ; un superadmin peut retirer tout le monde
  const canRemove = (member: PharmacyMember) =>
    myRole === 'superadmin' || (myRole === 'admin' && member.role === 'staff');

  return (
    <div className="space-y-5">
      {/* Inviter */}
      {canInvite && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="font-medium text-sm">Inviter un membre par email</p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              placeholder="email@exemple.mg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-48"
            />
            <Select
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as 'admin' | 'staff')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {invitableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={inviting} className="gap-2">
              <PaperPlaneRightIcon size={14} />
              {inviting ? 'Envoi…' : 'Inviter'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            L'invité recevra un email. S'il n'a pas de compte, il pourra en créer un.
          </p>
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="divide-y border rounded-lg">
          {members?.map((m) => (
            <div key={m.userId} className="flex items-center justify-between p-3 gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManageRoles ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m, v as PharmacyRole)}
                  >
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super-admin</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                )}
                {canRemove(m) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setRemoveTarget(m)}
                  >
                    <TrashIcon size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.email}</strong> perdra l'accès à la gestion de
              cette pharmacie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
