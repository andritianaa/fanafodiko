import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PharmacyStatusBadge } from './PharmacyStatusBadge';
import {
  PhoneIcon,
  NavigationArrowIcon,
  ClockIcon,
  CalendarDotsIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  FacebookLogoIcon,
  LinkIcon,
  MapPinIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { format, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Pharmacy, PharmacyContact } from '@ext/schemas';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function contactHref(c: PharmacyContact): string {
  switch (c.type) {
    case 'phone':
      return `tel:${c.value}`;
    case 'email':
      return `mailto:${c.value}`;
    case 'whatsapp':
      return `https://wa.me/${c.value.replace(/[^0-9]/g, '')}`;
    case 'facebook':
      return c.value.startsWith('http') ? c.value : `https://${c.value}`;
    default:
      return c.value.startsWith('http') ? c.value : `tel:${c.value}`;
  }
}

function ContactIcon({ type }: { type: PharmacyContact['type'] }) {
  const size = 16;
  switch (type) {
    case 'phone':
      return <PhoneIcon size={size} weight="fill" />;
    case 'email':
      return <EnvelopeSimpleIcon size={size} weight="fill" />;
    case 'whatsapp':
      return <WhatsappLogoIcon size={size} weight="fill" />;
    case 'facebook':
      return <FacebookLogoIcon size={size} weight="fill" />;
    default:
      return <LinkIcon size={size} />;
  }
}

interface Props {
  pharmacy: Pharmacy | null;
  onClose: () => void;
}

export function PharmacyDetailSheet({ pharmacy, onClose }: Props) {
  if (!pharmacy) return null;

  // Contacts effectifs : nouvelle liste + fallback sur le téléphone legacy
  const contacts: PharmacyContact[] =
    pharmacy.contacts && pharmacy.contacts.length > 0
      ? pharmacy.contacts
      : pharmacy.phone
      ? [{ type: 'phone', value: pharmacy.phone }]
      : [];

  const images = pharmacy.images ?? [];

  const handleNavigate = () => {
    const { lat, lng } = pharmacy.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  const sortedHours = [...(pharmacy.openingHours ?? [])].sort((a, b) => a.day - b.day);

  // Prochaines gardes = schedules actifs dont la endDate est dans le futur, triées par date
  const now = new Date();
  const upcomingGuards = [...(pharmacy.guardSchedules ?? [])]
    .filter((g) => g.isActive && isAfter(new Date(g.endDate), now))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <Sheet open={!!pharmacy} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[82vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <SheetTitle className="text-xl">{pharmacy.name}</SheetTitle>
            <PharmacyStatusBadge pharmacy={pharmacy} />
          </div>
          <p className="text-muted-foreground text-sm">{pharmacy.address}</p>
          {pharmacy.landmark && (
            <p className="text-muted-foreground text-xs italic flex items-center gap-1">
              <MapPinIcon size={11} /> {pharmacy.landmark}
            </p>
          )}
          <p className="text-sm font-medium">
            {pharmacy.city}
            {pharmacy.region ? `, ${pharmacy.region}` : ''}
          </p>
        </SheetHeader>

        {/* Carrousel d'images */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-4 pb-1 snap-x">
            {images.map((url) => (
              <img
                key={url}
                src={url}
                alt={pharmacy.name}
                className="h-40 w-60 object-cover rounded-lg border shrink-0 snap-start"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Action principale */}
        <div className="mb-4">
          <Button variant="outline" onClick={handleNavigate} className="w-full gap-2">
            <NavigationArrowIcon size={16} weight="fill" /> Y aller (itinéraire)
          </Button>
        </div>

        {/* Contacts */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {contacts.map((c, i) => (
              <Button
                key={i}
                asChild
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <a
                  href={contactHref(c)}
                  target={c.type === 'facebook' ? '_blank' : undefined}
                  rel="noreferrer"
                >
                  <ContactIcon type={c.type} />
                  {c.label || c.value}
                </a>
              </Button>
            ))}
          </div>
        )}

        {/* Horaires */}
        {pharmacy.isOpen24h ? (
          <>
            <Separator className="mb-4" />
            <div className="flex items-center gap-2 text-sky-600 font-medium text-sm">
              <ClockIcon size={16} />
              Ouvert 24h/24 — 7j/7
            </div>
          </>
        ) : sortedHours.length > 0 ? (
          <>
            <Separator className="mb-4" />
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2 mb-3 text-sm">
                <ClockIcon size={16} /> Horaires
              </p>
              {sortedHours.map((h) => (
                <div key={h.day} className="flex justify-between text-sm">
                  <span className="text-muted-foreground w-24">{DAYS[h.day]}</span>
                  {h.isClosed ? (
                    <span className="text-red-500">Fermé</span>
                  ) : (
                    <span className="font-medium">
                      {h.open} – {h.close}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* Prochaines gardes */}
        {upcomingGuards.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2 mb-3 text-sm">
                <CalendarDotsIcon size={16} /> Prochaines gardes
              </p>
              {upcomingGuards.map((g) => {
                const start = new Date(g.startDate);
                const end = new Date(g.endDate);
                const isNow = now >= start && now <= end;
                return (
                  <div
                    key={g.weekIdentifier}
                    className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                      isNow
                        ? 'bg-violet-50 border border-violet-200'
                        : 'bg-muted/40'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{g.weekIdentifier}</span>
                      <p className="text-xs text-muted-foreground">
                        {format(start, 'eee d MMM, HH:mm', { locale: fr })}
                        {' → '}
                        {format(end, 'eee d MMM, HH:mm', { locale: fr })}
                      </p>
                    </div>
                    {isNow && (
                      <Badge className="bg-violet-600 hover:bg-violet-700 text-xs">
                        En cours
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Message garde en cours */}
        {pharmacy.isOnGuard && (
          <>
            <Separator className="my-4" />
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800">
              <strong className="flex items-center gap-1.5"><WarningIcon size={14} weight="fill" /> Pharmacie de garde actuellement</strong>
              <p className="mt-1 text-xs">
                Un passage au commissariat ou un appel préalable peut être
                nécessaire selon les réglementations locales.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
