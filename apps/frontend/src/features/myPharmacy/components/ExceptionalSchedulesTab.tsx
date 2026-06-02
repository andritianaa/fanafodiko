import { useState } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  ShieldIcon,
  PencilIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type {
  ExceptionalSchedule,
  CreateExceptionalScheduleInput,
  PharmacyGuard,
  OpeningHour,
} from '@ext/schemas';
import {
  useAddExceptionalSchedule,
  useUpdateExceptionalSchedule,
  useDeleteExceptionalSchedule,
  useAddPharmacyGuard,
  useUpdatePharmacyGuard,
  useDeletePharmacyGuard,
} from '../api/hooks';
import {
  useBackofficeAddExceptionalSchedule,
  useBackofficeUpdateExceptionalSchedule,
  useBackofficeDeleteExceptionalSchedule,
  useBackofficeAddPharmacyGuard,
  useBackofficeUpdatePharmacyGuard,
  useBackofficeDeletePharmacyGuard,
} from '@/features/backoffice/api/hooks';

// ─── Helpers exceptions ───────────────────────────────────────────────────────

function toDateObj(dateStr: string): Date {
  return parseISO(dateStr + 'T12:00:00');
}

function getDatesInRange(start: string, end: string): Date[] {
  try {
    return eachDayOfInterval({ start: toDateObj(start), end: toDateObj(end) });
  } catch {
    return [];
  }
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return format(toDateObj(start), 'd MMM yyyy', { locale: fr });
  return `${format(toDateObj(start), 'd MMM', { locale: fr })} → ${format(toDateObj(end), 'd MMM yyyy', { locale: fr })}`;
}

// ─── Helpers gardes ───────────────────────────────────────────────────────────

function toEAT(isoString: string): Date {
  return new Date(new Date(isoString).getTime() + 3 * 60 * 60 * 1000);
}

function formatGuardRange(startIso: string, endIso: string): string {
  const start = toEAT(startIso);
  const end = toEAT(endIso);
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return `${format(start, 'd MMM yyyy', { locale: fr })} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
  }
  return `${format(start, 'd MMM yyyy HH:mm', { locale: fr })} → ${format(end, 'd MMM yyyy HH:mm', { locale: fr })}`;
}

function isoToEATForm(isoString: string): { date: Date; time: string } {
  const eat = toEAT(isoString);
  return {
    date: new Date(format(eat, 'yyyy-MM-dd') + 'T12:00:00'),
    time: format(eat, 'HH:mm'),
  };
}

function guardDays(startIso: string, endIso: string): Date[] {
  const days: Date[] = [];
  const cur = new Date(startIso);
  const end = new Date(endIso);
  cur.setUTCHours(12, 0, 0, 0);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ─── Form état exception ───────────────────────────────────────────────────────

interface ExceptionForm {
  type: 'opening' | 'closure' | 'guard';
  label: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime: string;
  endTime: string;
}

const emptyExceptionForm = (): ExceptionForm => ({
  type: 'opening',
  label: '',
  startDate: undefined,
  endDate: undefined,
  startTime: '08:00',
  endTime: '17:00',
});

function scheduleToForm(s: ExceptionalSchedule): ExceptionForm {
  return {
    type: s.type,
    label: s.label ?? '',
    startDate: toDateObj(s.startDate),
    endDate: toDateObj(s.endDate),
    startTime: s.startTime ?? '08:00',
    endTime: s.endTime ?? '17:00',
  };
}

function formToInput(f: ExceptionForm): CreateExceptionalScheduleInput | null {
  if (!f.startDate || !f.endDate || f.type === 'guard') return null;
  return {
    type: f.type,
    label: f.label || undefined,
    startDate: format(f.startDate, 'yyyy-MM-dd'),
    endDate: format(f.endDate, 'yyyy-MM-dd'),
    startTime: f.type === 'opening' ? f.startTime : undefined,
    endTime: f.type === 'opening' ? f.endTime : undefined,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  pharmacyId: string;
  schedules: ExceptionalSchedule[];
  pharmacyGuards: PharmacyGuard[];
  openingHours?: OpeningHour[];
  pharmacySource?: 'my' | 'backoffice';
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ExceptionalSchedulesTab({
  pharmacyId,
  schedules,
  pharmacyGuards,
  openingHours = [],
  pharmacySource = 'my',
}: Props) {
  // ── Exception state ──
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExceptionalSchedule | null>(null);
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm>(emptyExceptionForm());

  // ── Guard state ──
  const [guardEditing, setGuardEditing] = useState<PharmacyGuard | null>(null);

  // ── Exception hooks ──
  const myAdd = useAddExceptionalSchedule(pharmacyId);
  const myUpdate = useUpdateExceptionalSchedule(pharmacyId);
  const myDelete = useDeleteExceptionalSchedule(pharmacyId);
  const boAdd = useBackofficeAddExceptionalSchedule(pharmacyId);
  const boUpdate = useBackofficeUpdateExceptionalSchedule(pharmacyId);
  const boDelete = useBackofficeDeleteExceptionalSchedule(pharmacyId);
  const addMutation = pharmacySource === 'backoffice' ? boAdd : myAdd;
  const updateMutation = pharmacySource === 'backoffice' ? boUpdate : myUpdate;
  const deleteMutation = pharmacySource === 'backoffice' ? boDelete : myDelete;

  // ── Guard hooks ──
  const myAddGuard = useAddPharmacyGuard(pharmacyId);
  const myUpdateGuard = useUpdatePharmacyGuard(pharmacyId);
  const myDeleteGuard = useDeletePharmacyGuard(pharmacyId);
  const boAddGuard = useBackofficeAddPharmacyGuard(pharmacyId);
  const boUpdateGuard = useBackofficeUpdatePharmacyGuard(pharmacyId);
  const boDeleteGuard = useBackofficeDeletePharmacyGuard(pharmacyId);
  const addGuardMutation = pharmacySource === 'backoffice' ? boAddGuard : myAddGuard;
  const updateGuardMutation = pharmacySource === 'backoffice' ? boUpdateGuard : myUpdateGuard;
  const deleteGuardMutation = pharmacySource === 'backoffice' ? boDeleteGuard : myDeleteGuard;

  // ── Calendar modifiers ──
  const closedWeekdays = openingHours.filter((h) => h.isClosed).map((h) => h.day);
  const openingDays = schedules.filter((s) => s.type === 'opening').flatMap((s) => getDatesInRange(s.startDate, s.endDate));
  const closureDays = schedules.filter((s) => s.type === 'closure').flatMap((s) => getDatesInRange(s.startDate, s.endDate));
  const myGuardDays = pharmacyGuards.filter((g) => g.isActive).flatMap((g) => guardDays(g.startDate, g.endDate));

  // ── Today string (EAT) ──
  const todayStr = (() => {
    const d = new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  })();
  const nowIso = new Date().toISOString();

  // ── Exception handlers ──
  function openAdd(prefilledDate?: Date) {
    const base = emptyExceptionForm();
    if (prefilledDate) { base.startDate = prefilledDate; base.endDate = prefilledDate; }
    setExceptionForm(base);
    setEditing(null);
    setExceptionDialogOpen(true);
  }

  function openEdit(s: ExceptionalSchedule) {
    setExceptionForm(scheduleToForm(s));
    setEditing(s);
    setExceptionDialogOpen(true);
  }

  function closeExceptionDialog() {
    setExceptionDialogOpen(false);
    setEditing(null);
    setGuardEditing(null);
  }

  function handleSaveException() {
    if (!exceptionForm.startDate || !exceptionForm.endDate) {
      toast.error('Veuillez renseigner les dates');
      return;
    }

    if (exceptionForm.type === 'guard') {
      const data = {
        startDate: format(exceptionForm.startDate, 'yyyy-MM-dd'),
        startTime: exceptionForm.startTime,
        endDate: format(exceptionForm.endDate, 'yyyy-MM-dd'),
        endTime: exceptionForm.endTime,
        label: exceptionForm.label || undefined,
      };
      if (guardEditing) {
        updateGuardMutation.mutate(
          { guardId: guardEditing.id, data },
          { onSuccess: () => { toast.success('Garde mise à jour'); closeExceptionDialog(); }, onError: () => toast.error('Erreur') }
        );
      } else {
        addGuardMutation.mutate(data, {
          onSuccess: () => { toast.success('Garde déclarée'); closeExceptionDialog(); },
          onError: () => toast.error('Erreur'),
        });
      }
      return;
    }

    const input = formToInput(exceptionForm);
    if (!input) return;
    if (editing) {
      updateMutation.mutate(
        { scheduleId: editing.id, data: input },
        { onSuccess: () => { toast.success('Mis à jour'); closeExceptionDialog(); }, onError: () => toast.error('Erreur') }
      );
    } else {
      addMutation.mutate(input, {
        onSuccess: () => { toast.success('Exception ajoutée'); closeExceptionDialog(); },
        onError: () => toast.error('Erreur'),
      });
    }
  }

  function handleDeleteException(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Exception supprimée'),
      onError: () => toast.error('Erreur'),
    });
  }

  // ── Guard handlers ──
  function openAddGuard() {
    setGuardEditing(null);
    setEditing(null);
    setExceptionForm({ ...emptyExceptionForm(), type: 'guard', startTime: '14:00', endTime: '08:00' });
    setExceptionDialogOpen(true);
  }

  function openEditGuard(g: PharmacyGuard) {
    const start = isoToEATForm(g.startDate);
    const end = isoToEATForm(g.endDate);
    setGuardEditing(g);
    setEditing(null);
    setExceptionForm({ type: 'guard', label: g.label ?? '', startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time });
    setExceptionDialogOpen(true);
  }

  function handleToggleGuard(guardId: string, isActive: boolean) {
    updateGuardMutation.mutate(
      { guardId, data: { isActive } },
      { onSuccess: () => toast.success(isActive ? 'Garde activée' : 'Garde désactivée'), onError: () => toast.error('Erreur') }
    );
  }

  function handleDeleteGuard(guardId: string) {
    deleteGuardMutation.mutate(guardId, {
      onSuccess: () => toast.success('Garde supprimée'),
      onError: () => toast.error('Erreur'),
    });
  }

  // ── Filtered lists ──
  const upcomingExceptions = [...schedules]
    .filter((s) => s.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const sortedMyGuards = [...pharmacyGuards]
    .sort((a, b) => b.startDate.localeCompare(a.startDate)); // plus récentes en premier

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
      <div className="space-y-6">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-semibold text-base">Calendrier</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exceptions d'horaires et gardes pharmaceutiques
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openAddGuard}>
              <ShieldIcon className="mr-1.5" size={14} />
              Garde
            </Button>
            <Button size="sm" onClick={() => openAdd()}>
              <PlusIcon className="mr-1.5" size={14} />
              Exception
            </Button>
          </div>
        </div>

        {/* ─── Calendrier unifié ─── */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {closedWeekdays.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
                Jour fermé (habituel)
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-400 inline-block" />
              Ouverture exceptionnelle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-200 border border-red-400 inline-block" />
              Fermeture exceptionnelle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-200 border border-violet-400 inline-block" />
              Garde
            </span>
          </div>
          <Calendar
            locale={fr}
            numberOfMonths={2}
            modifiers={{
              ...(closedWeekdays.length > 0 ? { closedDay: { dayOfWeek: closedWeekdays } } : {}),
              opening: openingDays,
              closure: closureDays,
              myGuard: myGuardDays,
            }}
            modifiersClassNames={{
              closedDay: '!bg-red-100 !text-red-400 rounded',
              opening: '!bg-green-200 !text-green-900 rounded',
              closure: '!bg-red-300 !text-red-900 rounded',
              myGuard: '!bg-violet-200 !text-violet-900 rounded',
            }}
            onDayClick={(day) => openAdd(day)}
            className="[--cell-size:--spacing(11)] p-4 w-full"
          />
        </div>

        {/* ─── Exceptions à venir ─── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Exceptions à venir</p>
          {upcomingExceptions.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-xl">
              Aucune exception à venir.{' '}
              <button type="button" className="underline" onClick={() => openAdd()}>Ajouter</button>
            </div>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden">
              {upcomingExceptions.map((s) => (
                <ExceptionRow
                  key={s.id}
                  schedule={s}
                  onEdit={() => openEdit(s)}
                  onDelete={() => handleDeleteException(s.id)}
                  deleteLoading={deleteMutation.isPending && deleteMutation.variables === s.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── Gardes ─── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Gardes</p>
          {sortedMyGuards.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-xl">
              Aucune garde déclarée.{' '}
              <button type="button" className="underline" onClick={openAddGuard}>Déclarer une garde</button>
            </div>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden">
              {sortedMyGuards.map((g) => {
                const isPast = g.endDate < nowIso;
                const isCurrentlyActive = g.isActive && g.startDate <= nowIso && g.endDate >= nowIso;
                return (
                  <div key={g.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${isPast ? 'opacity-50' : ''}`}>
                    <ShieldIcon
                      size={16}
                      weight={isCurrentlyActive ? 'fill' : 'regular'}
                      className={isCurrentlyActive ? 'text-violet-500 mt-0.5' : 'text-muted-foreground mt-0.5'}
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {g.label && <p className="text-sm font-medium">{g.label}</p>}
                      <p className="text-sm text-muted-foreground">{formatGuardRange(g.startDate, g.endDate)}</p>
                      {isPast && <p className="text-xs text-muted-foreground">Terminée</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isPast && (
                        <Switch
                          checked={g.isActive}
                          onCheckedChange={(checked) => handleToggleGuard(g.id, checked)}
                          disabled={updateGuardMutation.isPending}
                        />
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditGuard(g)}>
                        <PencilIcon size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGuard(g.id)}
                        disabled={deleteGuardMutation.isPending}
                      >
                        <TrashIcon size={15} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Dialog unifié (exception + garde) ─── */}
        <Dialog open={exceptionDialogOpen} onOpenChange={(o) => { if (!o) closeExceptionDialog(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier l'exception" : guardEditing ? 'Modifier la garde' : 'Ajouter'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Type */}
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={exceptionForm.type}
                  onValueChange={(v) => setExceptionForm({
                    ...exceptionForm,
                    type: v as ExceptionForm['type'],
                    startTime: v === 'guard' ? '14:00' : '08:00',
                    endTime: v === 'guard' ? '08:00' : '17:00',
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">🟢 Ouverture exceptionnelle</SelectItem>
                    <SelectItem value="closure">🔴 Fermeture exceptionnelle</SelectItem>
                    <SelectItem value="guard">🟣 Garde pharmaceutique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Libellé */}
              <div className="space-y-1.5">
                <Label>Libellé <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  placeholder={exceptionForm.type === 'guard' ? 'ex: Garde de semaine…' : 'ex: Fête nationale, Inventaire…'}
                  value={exceptionForm.label}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, label: e.target.value })}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date de début</Label>
                  <DatePicker date={exceptionForm.startDate} setDate={(d) => setExceptionForm({ ...exceptionForm, startDate: d, endDate: d ?? exceptionForm.endDate })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date de fin</Label>
                  <DatePicker date={exceptionForm.endDate} setDate={(d) => setExceptionForm({ ...exceptionForm, endDate: d })} />
                </div>
              </div>

              {/* Heures (ouverture exceptionnelle ou garde) */}
              {(exceptionForm.type === 'opening' || exceptionForm.type === 'guard') && (
                <>
                  {exceptionForm.type === 'guard' && (
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                      Heures en <strong>heure locale Madagascar (EAT)</strong>.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{exceptionForm.type === 'guard' ? 'Heure de début' : "Heure d'ouverture"}</Label>
                      <Input type="time" value={exceptionForm.startTime} onChange={(e) => setExceptionForm({ ...exceptionForm, startTime: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{exceptionForm.type === 'guard' ? 'Heure de fin' : 'Heure de fermeture'}</Label>
                      <Input type="time" value={exceptionForm.endTime} onChange={(e) => setExceptionForm({ ...exceptionForm, endTime: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeExceptionDialog}>Annuler</Button>
              <Button onClick={handleSaveException} disabled={isPending || addGuardMutation.isPending || updateGuardMutation.isPending}>
                {(isPending || addGuardMutation.isPending || updateGuardMutation.isPending)
                  ? 'Enregistrement…'
                  : (editing || guardEditing) ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
  );
}

// ─── Ligne exception ──────────────────────────────────────────────────────────

function ExceptionRow({
  schedule,
  onEdit,
  onDelete,
  deleteLoading,
}: {
  schedule: ExceptionalSchedule;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}) {
  const isOpening = schedule.type === 'opening';
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={isOpening ? 'border-green-400 text-green-700 bg-green-50' : 'border-red-400 text-red-700 bg-red-50'}>
            {isOpening ? 'Ouverture' : 'Fermeture'}
          </Badge>
          {schedule.label && <span className="text-sm font-medium">{schedule.label}</span>}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(schedule.startDate, schedule.endDate)}
          {isOpening && schedule.startTime && schedule.endTime && (
            <span className="ml-2 text-xs">· {schedule.startTime} – {schedule.endTime}</span>
          )}
          {!isOpening && schedule.reason && (
            <span className="ml-2 text-xs italic">· {schedule.reason}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <PencilSimpleIcon size={15} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} disabled={deleteLoading}>
          <TrashIcon size={15} />
        </Button>
      </div>
    </div>
  );
}
