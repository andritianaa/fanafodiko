import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusIcon,
  TrashIcon,
  ShieldIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { PharmacyGuard, GuardSchedule } from "@ext/schemas";
import {
  useAddPharmacyGuard,
  useUpdatePharmacyGuard,
  useDeletePharmacyGuard,
} from "../api/hooks";
import {
  useBackofficeAddPharmacyGuard,
  useBackofficeUpdatePharmacyGuard,
  useBackofficeDeletePharmacyGuard,
} from "@/features/backoffice/api/hooks";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** EAT = UTC+3 : ajoute 3h à la date ISO UTC pour obtenir l'heure locale */
function toEAT(isoString: string): Date {
  const d = new Date(isoString);
  return new Date(d.getTime() + 3 * 60 * 60 * 1000);
}

function formatGuardRange(startIso: string, endIso: string): string {
  const start = toEAT(startIso);
  const end = toEAT(endIso);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");

  if (sameDay) {
    return `${format(start, "d MMM yyyy", { locale: fr })} · ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  }
  return `${format(start, "d MMM yyyy HH:mm", { locale: fr })} → ${format(end, "d MMM yyyy HH:mm", { locale: fr })}`;
}

/** Toutes les dates (jours) couverts par une plage de garde */
function guardDays(startIso: string, endIso: string): Date[] {
  const days: Date[] = [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  const cur = new Date(start);
  cur.setUTCHours(12, 0, 0, 0);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  pharmacyId: string;
  /** Gardes déclarées par la pharmacie (plages libres) */
  pharmacyGuards: PharmacyGuard[];
  /** Gardes assignées par le backoffice (semaines ISO, lecture seule) */
  backofficeGuards: GuardSchedule[];
  pharmacySource?: "my" | "backoffice";
}

export function GuardCalendarTab({
  pharmacyId,
  pharmacyGuards,
  backofficeGuards,
  pharmacySource = "my",
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    startDate: undefined as Date | undefined,
    startTime: "14:00",
    endDate: undefined as Date | undefined,
    endTime: "08:00",
    label: "",
  });

  const myAdd = useAddPharmacyGuard(pharmacyId);
  const myUpdate = useUpdatePharmacyGuard(pharmacyId);
  const myDelete = useDeletePharmacyGuard(pharmacyId);
  const boAdd = useBackofficeAddPharmacyGuard(pharmacyId);
  const boUpdate = useBackofficeUpdatePharmacyGuard(pharmacyId);
  const boDelete = useBackofficeDeletePharmacyGuard(pharmacyId);

  const addMutation = pharmacySource === "backoffice" ? boAdd : myAdd;
  const updateMutation = pharmacySource === "backoffice" ? boUpdate : myUpdate;
  const deleteMutation = pharmacySource === "backoffice" ? boDelete : myDelete;

  // Days for calendar modifiers
  const myGuardDays = pharmacyGuards
    .filter((g) => g.isActive)
    .flatMap((g) => guardDays(g.startDate, g.endDate));

  const backofficeGuardDays = backofficeGuards
    .filter((g) => g.isActive)
    .flatMap((g) => guardDays(g.startDate, g.endDate));

  function resetForm() {
    setForm({
      startDate: undefined,
      startTime: "14:00",
      endDate: undefined,
      endTime: "08:00",
      label: "",
    });
  }

  function handleAddGuard() {
    if (!form.startDate || !form.endDate) {
      toast.error("Veuillez renseigner les dates de début et de fin");
      return;
    }
    addMutation.mutate(
      {
        startDate: format(form.startDate, "yyyy-MM-dd"),
        startTime: form.startTime,
        endDate: format(form.endDate, "yyyy-MM-dd"),
        endTime: form.endTime,
        label: form.label || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Garde déclarée");
          setDialogOpen(false);
          resetForm();
        },
        onError: () => toast.error("Erreur lors de la déclaration"),
      },
    );
  }

  function handleToggleActive(guardId: string, isActive: boolean) {
    updateMutation.mutate(
      { guardId, data: { isActive } },
      {
        onSuccess: () =>
          toast.success(isActive ? "Garde activée" : "Garde désactivée"),
        onError: () => toast.error("Erreur"),
      },
    );
  }

  function handleDelete(guardId: string) {
    deleteMutation.mutate(guardId, {
      onSuccess: () => toast.success("Garde supprimée"),
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  const sortedMyGuards = [...pharmacyGuards].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Gardes pharmaceutiques</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Déclarez les plages de garde de votre pharmacie
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon className="mr-1.5" size={15} />
            Déclarer une garde
          </Button>
        </div>

        {/* ─── Calendrier ─── */}
        {(myGuardDays.length > 0 || backofficeGuardDays.length > 0) && (
          <div className="border rounded-xl overflow-hidden">
            <div className="px-3 pt-3 pb-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-violet-200 border border-violet-400 inline-block" />
                Vos gardes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-200 border border-sky-400 inline-block" />
                Gardes assignées (backoffice)
              </span>
            </div>
            <Calendar
              locale={fr}
              numberOfMonths={2}
              modifiers={{
                myGuard: myGuardDays,
                backofficeGuard: backofficeGuardDays,
              }}
              modifiersClassNames={{
                myGuard: "!bg-violet-200 !text-violet-900 rounded",
                backofficeGuard: "!bg-sky-200 !text-sky-900 rounded",
              }}
              className="p-3"
            />
          </div>
        )}

        {/* ─── Gardes backoffice (lecture seule) ─── */}
        {backofficeGuards.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Gardes assignées par l'administration
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Ces gardes sont gérées par l'administration de l'application
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="divide-y border rounded-xl overflow-hidden">
              {backofficeGuards
                .slice()
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((g, i) => {
                  const now = new Date().toISOString();
                  const isActive =
                    g.isActive && g.startDate <= now && g.endDate >= now;
                  return (
                    <div
                      key={g.weekIdentifier ?? i}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <ShieldIcon
                        size={16}
                        weight={isActive ? "fill" : "regular"}
                        className={
                          isActive ? "text-sky-500" : "text-muted-foreground"
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          {formatGuardRange(g.startDate, g.endDate)}
                        </p>
                        {g.weekIdentifier && (
                          <p className="text-xs text-muted-foreground">
                            Semaine {g.weekIdentifier}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          isActive
                            ? "border-sky-400 text-sky-700 bg-sky-50"
                            : g.isActive
                              ? "border-muted text-muted-foreground"
                              : "border-muted text-muted-foreground opacity-50"
                        }
                      >
                        {isActive
                          ? "En cours"
                          : g.isActive
                            ? "À venir"
                            : "Inactive"}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── Mes gardes ─── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Vos gardes déclarées
          </p>
          {sortedMyGuards.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl">
              Aucune garde déclarée. Cliquez sur "Déclarer une garde" pour en
              ajouter.
            </div>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden">
              {sortedMyGuards.map((g) => {
                const now = new Date().toISOString();
                const isCurrentlyActive =
                  g.isActive && g.startDate <= now && g.endDate >= now;
                return (
                  <div
                    key={g.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <ShieldIcon
                      size={16}
                      weight={isCurrentlyActive ? "fill" : "regular"}
                      className={
                        isCurrentlyActive
                          ? "text-violet-500 mt-0.5"
                          : "text-muted-foreground mt-0.5"
                      }
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {g.label && (
                        <p className="text-sm font-medium">{g.label}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatGuardRange(g.startDate, g.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={g.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(g.id, checked)
                        }
                        disabled={updateMutation.isPending}
                        aria-label="Activer / désactiver la garde"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(g.id)}
                        disabled={deleteMutation.isPending}
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

        {/* ─── Dialog déclarer une garde ─── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Déclarer une garde</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                Les heures sont en{" "}
                <strong>heure locale Madagascar (EAT)</strong>.
              </p>

              {/* Libellé */}
              <div className="space-y-1.5">
                <Label>
                  Libellé{" "}
                  <span className="text-muted-foreground text-xs">
                    (optionnel)
                  </span>
                </Label>
                <Input
                  placeholder="ex: Garde de semaine, Garde de fête…"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>

              {/* Début */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date de début</Label>
                  <DatePicker
                    date={form.startDate}
                    setDate={(d) =>
                      setForm({
                        ...form,
                        startDate: d,
                        endDate: !form.endDate ? d : form.endDate,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure de début</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Fin */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date de fin</Label>
                  <DatePicker
                    date={form.endDate}
                    setDate={(d) => setForm({ ...form, endDate: d })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure de fin</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddGuard} disabled={addMutation.isPending}>
                {addMutation.isPending
                  ? "Enregistrement…"
                  : "Déclarer la garde"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
