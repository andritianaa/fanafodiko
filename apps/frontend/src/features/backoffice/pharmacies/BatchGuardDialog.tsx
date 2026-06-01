import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBatchUpdateGuard } from '@/features/pharmacy/api/hooks';
import { currentWeekIdentifier, nextWeekIdentifier } from '@/features/pharmacy/utils/weekUtils';
import { toast } from 'sonner';
import type { Pharmacy } from '@ext/schemas';

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacies: Pharmacy[];
}

export function BatchGuardDialog({ open, onClose, pharmacies }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [weekId, setWeekId] = useState(nextWeekIdentifier());
  const [search, setSearch] = useState('');
  const { mutate, isPending } = useBatchUpdateGuard();

  const filtered = pharmacies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleApply = () => {
    if (selected.size === 0) { toast.error('Sélectionnez au moins une pharmacie'); return; }
    mutate(
      { pharmacyIds: Array.from(selected), weekIdentifier: weekId, isActive: true },
      {
        onSuccess: () => {
          toast.success(`Garde appliquée à ${selected.size} pharmacie(s)`);
          setSelected(new Set());
          onClose();
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Saisie par lot,Pharmacies de Garde</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Semaine (identifiant)</Label>
            <Input
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              placeholder="2026-W23"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cette semaine : {currentWeekIdentifier()} · Semaine prochaine : {nextWeekIdentifier()}
            </p>
          </div>

          <Input
            placeholder="Rechercher une pharmacie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg mt-2">
          <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/50 sticky top-0">
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Tout sélectionner ({filtered.length})
            </label>
            {selected.size > 0 && (
              <span className="ml-auto text-sm text-primary font-medium">
                {selected.size} sélectionnée(s)
              </span>
            )}
          </div>

          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 cursor-pointer"
              onClick={() => toggle(p.id)}
            >
              <Checkbox
                checked={selected.has(p.id)}
                onCheckedChange={() => toggle(p.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.city}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleApply} disabled={isPending || selected.size === 0}>
            {isPending ? 'Application…' : `Appliquer la garde (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
