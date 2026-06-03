import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PharmacyList } from "@/features/pharmacy/components/PharmacyList";
import { usePharmacies } from "@/features/pharmacy/api/hooks";
import type { PharmacyFilter } from "@/features/pharmacy/api/fetchers";
import type { Pharmacy } from "@ext/schemas";
import {
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  XIcon,
  PlusCircleIcon,
  ShieldIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

const PharmacyMap = lazy(() =>
  import("@/features/pharmacy/components/PharmacyMap").then((m) => ({
    default: m.PharmacyMap,
  })),
);

// ── Status filter pills ───────────────────────────────────────────────────────

interface StatusOption {
  value: PharmacyFilter;
  label: string;
  icon?: React.ReactNode;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: undefined, label: "Toutes" },
  {
    value: "open",
    label: "Ouvert",
    icon: (
      <CheckCircleIcon size={12} weight="fill" className="text-green-600" />
    ),
  },
  {
    value: "guard",
    label: "De Garde",
    icon: <ShieldIcon size={12} weight="fill" className="text-violet-600" />,
  },
  {
    value: "24h",
    label: "24h/24",
    icon: <ClockIcon size={12} weight="fill" className="text-sky-600" />,
  },
];

// ── Client-side multi-field filter ───────────────────────────────────────────

type LocalFilters = string; // recherche libre sur tous les champs

function applyLocalFilters(
  pharmacies: Pharmacy[],
  q: LocalFilters,
): Pharmacy[] {
  const term = q.trim().toLowerCase();
  if (!term) return pharmacies;
  return pharmacies.filter((p) => {
    const searchable = [
      p.name,
      p.address,
      p.city,
      p.region ?? "",
      p.landmark ?? "",
      ...(p.contacts ?? []).map((c) => c.value),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });
}

function hasActiveLocalFilters(f: LocalFilters) {
  return f.trim() !== "";
}

// ── Sidebar content ───────────────────────────────────────────────────────────

interface SidebarProps {
  statusFilter: PharmacyFilter;
  setStatusFilter: (v: PharmacyFilter) => void;
  localFilters: LocalFilters;
  setLocalFilters: (f: LocalFilters) => void;
  filtered: Pharmacy[];
  selected: Pharmacy | null;
  onSelect: (p: Pharmacy) => void;
  userLocation: [number, number] | null;
  isLoading: boolean;
  totalCount: number;
}

function SidebarContent({
  statusFilter,
  setStatusFilter,
  localFilters,
  setLocalFilters,
  filtered,
  selected,
  onSelect,
  userLocation,
  isLoading,
  totalCount,
}: SidebarProps) {
  const activeLocal = hasActiveLocalFilters(localFilters);
  const activeCount =
    (statusFilter !== undefined ? 1 : 0) + (activeLocal ? 1 : 0);

  const clearAll = () => {
    setStatusFilter(undefined);
    setLocalFilters("");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Filtres & Recherche</span>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon size={12} /> Effacer tout
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={String(value)}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border text-muted-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search field */}
      <div className="px-4 py-3 border-b shrink-0">
        <div className="relative">
          <MagnifyingGlassIcon
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={localFilters}
            onChange={(e) => setLocalFilters(e.target.value)}
            placeholder="Nom, ville, adresse, contact…"
            className="pl-8 pr-7 h-8 text-xs"
          />
          {localFilters && (
            <button
              onClick={() => setLocalFilters("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">
          {filtered.length}
          {filtered.length !== totalCount && <span> / {totalCount}</span>}{" "}
          pharmacie{totalCount > 1 ? "s" : ""}
        </span>
        {filtered.length !== totalCount && (
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            filtré
          </Badge>
        )}
      </div>

      {/* List,scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <PharmacyList
            pharmacies={filtered}
            selected={selected}
            onSelect={onSelect}
            userLocation={userLocation}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0 space-y-2">
        <Button size="sm" variant="outline" className="w-full gap-1.5" asChild>
          <Link to="/suggest-pharmacy">
            <PlusCircleIcon size={14} /> Suggérer une pharmacie
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MapPage() {
  const location = useLocation();
  const flyTarget = location.state as { pharmacyId?: string; lat?: number; lng?: number } | null;

  const [statusFilter, setStatusFilter] = useState<PharmacyFilter>(undefined);
  const [localFilters, setLocalFilters] = useState<LocalFilters>("");
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sidebar sheet

  const { data, isLoading } = usePharmacies(statusFilter);
  const allPharmacies = data?.pharmacies ?? [];

  // Dès que les pharmacies sont chargées, sélectionner + zoomer sur la cible
  useEffect(() => {
    if (!flyTarget?.pharmacyId || allPharmacies.length === 0) return;
    const match = allPharmacies.find((p) => p.id === flyTarget.pharmacyId);
    if (match) setSelected(match);
  }, [flyTarget?.pharmacyId, allPharmacies]);

  const filtered = useMemo(
    () => applyLocalFilters(allPharmacies, localFilters),
    [allPharmacies, localFilters],
  );

  const activeFilterCount =
    (statusFilter !== undefined ? 1 : 0) +
    (hasActiveLocalFilters(localFilters) ? 1 : 0);

  const sidebarProps: SidebarProps = {
    statusFilter,
    setStatusFilter,
    localFilters,
    setLocalFilters,
    filtered,
    selected,
    onSelect: setSelected,
    userLocation,
    isLoading,
    totalCount: allPharmacies.length,
  };

  return (
    <>
      {/*
        Le <main> de MainLayout est flex-col + overflow-hidden pour /map,
        donc on remplit simplement tout l'espace disponible.
      */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* ── Desktop sidebar (toujours visible) ───────────────────────── */}
        <div className="hidden md:flex flex-col border-r shrink-0 w-96">
          <SidebarContent {...sidebarProps} />
        </div>

        {/* ── Map area ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative min-w-0">

          {/* Mobile, bouton flottant bas droite pour ouvrir le sheet */}
          {!sheetOpen && (
            <button
              onClick={() => setSheetOpen(true)}
              className="cursor-pointer md:hidden absolute bottom-16 right-4 z-[800] w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <FunnelSimpleIcon size={22} weight="bold" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white text-primary text-[11px] font-bold flex items-center justify-center shadow">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Desktop top-right controls */}
          <div className="hidden md:flex absolute top-3 right-3 z-[800] items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter(undefined);
                  setLocalFilters("");
                }}
                className="gap-1.5 bg-white shadow-sm"
              >
                <XIcon size={13} /> Effacer filtres
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  {activeFilterCount}
                </Badge>
              </Button>
            )}
          </div>

          {/* Leaflet map,full size */}
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <PharmacyMap
              pharmacies={filtered}
              selected={selected}
              onSelect={setSelected}
              onLocationUpdate={setUserLocation}
              initialCenter={flyTarget?.lat && flyTarget?.lng ? [flyTarget.lat, flyTarget.lng] : null}
            />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile sidebar Sheet ───────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-0 shrink-0">
            <SheetTitle className="text-base">Pharmacies</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SidebarContent
              {...sidebarProps}
              onSelect={(p) => { setSelected(p); setSheetOpen(false); }}
            />
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
