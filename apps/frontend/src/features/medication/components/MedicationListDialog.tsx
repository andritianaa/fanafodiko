import { PillIcon, TrashIcon, PencilIcon } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMedications, useRemoveMedication, useToggleMedicationStatus } from '../api/hooks';
import { toast } from 'sonner';
import type { Medication } from '../types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/utils';
import { DAY_MAP } from '../constants';

interface MedicationListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  onEdit: (medication: Medication) => void;
}

interface MedicationItemProps {
  med: Medication;
  onEdit: (med: Medication) => void;
  onToggle: (id: string, currentStatus: boolean) => void;
  onRemove: (id: string) => void;
  getFrequencyLabel: (med: Medication) => string;
}

const MedicationItem = ({
  med,
  onEdit,
  onToggle,
  onRemove,
  getFrequencyLabel,
}: MedicationItemProps) => (
  <div
    className={`p-4 rounded-2xl border transition-all ${
      med.isActive
        ? 'bg-background border-border'
        : 'bg-muted/50 border-transparent opacity-70'
    }`}
  >
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-lg">{med.name}</h4>
          <Badge variant="outline" className="rounded-full">
            {med.dosage}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{getFrequencyLabel(med)}</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          Actif
        </span>
        <Switch
          checked={med.isActive}
          onCheckedChange={() => onToggle(med.id, med.isActive)}
        />
      </div>
    </div>

    <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        Du {formatDate(med.startDate)}
        {med.endDate && ` au ${formatDate(med.endDate)}`}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(med)}
          className="rounded-full"
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(med.id)}
          className="rounded-full text-destructive hover:bg-destructive/10"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  </div>
);


export const MedicationListDialog = ({
  open,
  onOpenChange,
  profileId,
  profileName,
  onEdit,
}: MedicationListDialogProps) => {
  const { data: medications, isLoading } = useMedications(profileId);
  const { mutate: removeMedication } = useRemoveMedication();
  const { mutate: toggleStatus } = useToggleMedicationStatus();

  const handleRemove = (id: string) => {
    if (globalThis.confirm('Supprimer ce médicament ?')) {
      removeMedication(id, {
        onSuccess: () => toast.success('Médicament supprimé'),
        onError: (error: any) => toast.error(error.response?.data?.message || 'Erreur'),
      });
    }
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleStatus({ id, isActive: !currentStatus });
  };

  const getFrequencyLabel = (med: Medication) => {
    const times = med.frequency.times.join(', ');
    if (med.frequency.type === 'DAILY') return `Chaque jour à ${times}`;
    if (med.frequency.type === 'WEEKLY') {
      const days = med.frequency.days?.map(d => DAY_MAP[d] || d).join(', ');
      return `Chaque ${days} à ${times}`;
    }
    return `Toutes les ${times}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PillIcon className="size-6 text-primary" weight="fill" />
            Traitements de {profileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 px-1">
          {isLoading && (
            <div className="space-y-3">
              {['sk1', 'sk2', 'sk3'].map((id) => (
                <Skeleton key={id} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && medications?.length === 0 && (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
              <PillIcon className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun médicament enregistré.</p>
            </div>
          )}

          {!isLoading && medications && medications.length > 0 && (
            <div className="grid gap-3">
              {medications.map((med) => (
                <MedicationItem
                  key={med.id}
                  med={med}
                  onEdit={onEdit}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                  getFrequencyLabel={getFrequencyLabel}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
