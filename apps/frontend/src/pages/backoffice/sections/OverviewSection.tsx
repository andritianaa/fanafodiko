import { useOutletContext } from 'react-router-dom';
import { PharmacyStatusBadge } from '@/features/pharmacy/components/PharmacyStatusBadge';
import { ClockIcon } from '@phosphor-icons/react';
import type { BackofficePharmacyContext } from '../BackofficePharmacyLayout';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function OverviewSection() {
  const { pharmacy } = useOutletContext<BackofficePharmacyContext>();
  const today = new Date().getDay();
  const todayHours = (pharmacy.openingHours ?? []).find((h) => h.day === today);
  const activeGuards = (pharmacy.pharmacyGuards ?? []).filter((g) => g.isActive).length;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Statut en temps réel */}
      <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/20">
        <PharmacyStatusBadge pharmacy={pharmacy} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{pharmacy.address}</p>
          <p className="text-xs text-muted-foreground">
            {pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}
          </p>
        </div>
      </div>

      {/* Horaire du jour */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <ClockIcon size={13} /> Aujourd'hui
        </p>
        {pharmacy.isOpen24h ? (
          <p className="text-sm font-medium text-sky-600">Ouvert 24h/24</p>
        ) : todayHours ? (
          todayHours.isClosed ? (
            <p className="text-sm text-destructive">Fermé</p>
          ) : (
            <p className="text-sm font-medium">{todayHours.open} – {todayHours.close}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Horaires non définis</p>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">
            {(pharmacy.openingHours ?? []).filter((h) => !h.isClosed).length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">jours d'ouverture / sem.</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{activeGuards}</p>
          <p className="text-xs text-muted-foreground mt-0.5">garde(s) active(s)</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{(pharmacy.exceptionalSchedules ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">exception(s) d'horaire</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{(pharmacy.images ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">photo(s)</p>
        </div>
      </div>

      {/* Planning habituel */}
      {!pharmacy.isOpen24h && (pharmacy.openingHours ?? []).length > 0 && (
        <div className="border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Planning habituel
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {[...(pharmacy.openingHours ?? [])].sort((a, b) => a.day - b.day).map((h) => (
              <div
                key={h.day}
                className={`flex justify-between text-xs ${h.day === today ? 'font-bold text-primary' : ''}`}
              >
                <span className="text-muted-foreground w-8 shrink-0">{DAYS[h.day]}</span>
                {h.isClosed ? (
                  <span className="text-destructive">Fermé</span>
                ) : (
                  <span>{h.open}–{h.close}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
