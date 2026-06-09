import { useState, lazy, Suspense, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePharmacy } from '@/features/pharmacy/api/hooks';
import { useSubmitClaim } from '@/features/pharmacy/api/claimHooks';
import { uploadImage } from '@/features/pharmacy/api/upload';
import { PharmacyStatusBadge } from '@/features/pharmacy/components/PharmacyStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  NavigationArrowIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  FacebookLogoIcon,
  LinkIcon,
  ClockIcon,
  CalendarDotsIcon,
  MapPinIcon,
  WarningIcon,
  ImageIcon,
  XIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassPlusIcon,
  StorefrontIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Pharmacy, PharmacyContact } from '@ext/schemas';

// Lazy-load mini-map (Leaflet)
const MiniMap = lazy(() => import('./MiniMap'));

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function contactHref(c: PharmacyContact): string {
  switch (c.type) {
    case 'phone': return `tel:${c.value}`;
    case 'email': return `mailto:${c.value}`;
    case 'whatsapp': return `https://wa.me/${c.value.replace(/[^0-9]/g, '')}`;
    case 'facebook': return c.value.startsWith('http') ? c.value : `https://${c.value}`;
    default: return c.value.startsWith('http') ? c.value : `tel:${c.value}`;
  }
}

function ContactIcon({ type }: { type: PharmacyContact['type'] }) {
  const cls = 'shrink-0';
  switch (type) {
    case 'phone': return <PhoneIcon size={15} weight="fill" className={cls} />;
    case 'email': return <EnvelopeSimpleIcon size={15} weight="fill" className={cls} />;
    case 'whatsapp': return <WhatsappLogoIcon size={15} weight="fill" className={cls} />;
    case 'facebook': return <FacebookLogoIcon size={15} weight="fill" className={cls} />;
    default: return <LinkIcon size={15} className={cls} />;
  }
}

// ── Image gallery + lightbox ────────────────────────────────────────────────

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground gap-2">
        <ImageIcon size={28} weight="thin" />
        <p className="text-sm">Aucune photo disponible</p>
      </div>
    );
  }

  const prev = () => setLightbox((i) => (i! > 0 ? i! - 1 : images.length - 1));
  const next = () => setLightbox((i) => (i! < images.length - 1 ? i! + 1 : 0));

  return (
    <>
      {/* Gallery grid */}
      {images.length === 1 ? (
        <button
          onClick={() => setLightbox(0)}
          className="relative w-full rounded-xl overflow-hidden group cursor-zoom-in"
        >
          <img
            src={images[0]}
            alt={name}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <MagnifyingGlassPlusIcon size={32} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* First image spans 2 rows on desktop if 3+ images */}
          {images.slice(0, Math.min(images.length, 6)).map((url, idx) => (
            <button
              key={url}
              onClick={() => setLightbox(idx)}
              className={`relative rounded-xl overflow-hidden group cursor-zoom-in ${
                idx === 0 && images.length >= 3 ? 'row-span-2 sm:col-span-1' : ''
              }`}
            >
              <img
                src={url}
                alt={`${name} ${idx + 1}`}
                className={`w-full object-cover ${idx === 0 && images.length >= 3 ? 'h-48 sm:h-full min-h-[144px]' : 'h-32'}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <MagnifyingGlassPlusIcon size={22} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
              </div>
              {/* "+N" overlay on last visible thumbnail if more images */}
              {idx === 5 && images.length > 6 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <span className="text-white font-bold text-lg">+{images.length - 6}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 rounded-full p-2 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <XIcon size={22} />
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightbox + 1} / {images.length}
          </span>

          {/* Image */}
          <img
            src={images[lightbox]}
            alt={`${name} ${lightbox + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2.5 transition-colors"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <CaretLeftIcon size={22} weight="bold" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/30 rounded-full p-2.5 transition-colors"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <CaretRightIcon size={22} weight="bold" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PharmacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pharmacy, isLoading, isError } = usePharmacy(id!);

  if (isLoading) return <PharmacyDetailSkeleton />;
  if (isError || !pharmacy) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Pharmacie introuvable.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeftIcon size={15} className="mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return <PharmacyDetail pharmacy={pharmacy} />;
}

// ── Claim modal ────────────────────────────────────────────────────────────────

function ClaimModal({ pharmacyId, pharmacyName, open, onClose }: {
  pharmacyId: string;
  pharmacyName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: submit, isPending } = useSubmitClaim();
  const fileRef = useRef<HTMLInputElement>(null);
  const [contactInfo, setContactInfo] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const results = await Promise.all(files.map(uploadImage));
      setProofImages((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch {
      toast.error("Erreur lors du téléversement des images");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!contactInfo.trim()) {
      toast.error('Veuillez indiquer un contact (téléphone ou email)');
      return;
    }
    submit(
      { pharmacyId, contactInfo: contactInfo.trim(), proofImages },
      {
        onSuccess: () => {
          toast.success('Réclamation envoyée — nous vous contacterons sous peu');
          onClose();
          setContactInfo('');
          setProofImages([]);
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Erreur lors de l'envoi"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Je suis gérant de {pharmacyName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Renseignez vos coordonnées et joignez des pièces justificatives prouvant
            que vous gérez cette pharmacie (carte pro, bail, registre du commerce…).
            Notre équipe examinera votre demande.
          </p>
          <div className="space-y-1.5">
            <Label>Contact <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Téléphone ou e-mail"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pièces justificatives</Label>
            {proofImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {proofImages.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="justificatif" className="h-20 w-20 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setProofImages((prev) => prev.filter((u) => u !== url))}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              <ImageIcon size={14} />
              {uploading ? 'Téléversement…' : 'Ajouter des images'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending || uploading}>
            {isPending ? 'Envoi…' : 'Envoyer la réclamation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PharmacyDetail({ pharmacy }: { pharmacy: Pharmacy }) {
  const navigate = useNavigate();
  const [claimOpen, setClaimOpen] = useState(false);

  const contacts: PharmacyContact[] =
    pharmacy.contacts && pharmacy.contacts.length > 0
      ? pharmacy.contacts
      : pharmacy.phone
      ? [{ type: 'phone' as const, value: pharmacy.phone }]
      : [];

  const sortedHours = [...(pharmacy.openingHours ?? [])].sort((a, b) => a.day - b.day);
  const now = new Date();

  const todayStr = (() => {
    const d = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  })();

  const todayException = (pharmacy.exceptionalSchedules ?? []).find(
    (s) => s.startDate <= todayStr && s.endDate >= todayStr,
  );

  const upcomingExceptions = (pharmacy.exceptionalSchedules ?? [])
    .filter((s) => s.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const upcomingGuards = [...(pharmacy.guardSchedules ?? [])]
    .filter((g) => g.isActive && isAfter(new Date(g.endDate), now))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pharmacyGuards = (pharmacy.pharmacyGuards ?? [])
    .filter((g) => g.isActive && isAfter(new Date(g.endDate), now))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const handleNavigate = () => {
    const { lat, lng } = pharmacy.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank',
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* ── Breadcrumb + header ─────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeftIcon size={14} /> Retour
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{pharmacy.name}</h1>
            <p className="text-muted-foreground mt-1">
              {pharmacy.address}
              {pharmacy.landmark ? ` · ${pharmacy.landmark}` : ''}
            </p>
            <p className="text-sm font-medium mt-0.5">
              {pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PharmacyStatusBadge pharmacy={pharmacy} />
          </div>
        </div>

        {/* Exception today */}
        {todayException && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${
              todayException.type === 'closure'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}
          >
            <WarningIcon size={15} weight="fill" className="mt-0.5 shrink-0" />
            <div>
              {todayException.type === 'closure' ? (
                <>Fermeture exceptionnelle aujourd'hui{todayException.label ? `, ${todayException.label}` : ''}</>
              ) : (
                <>
                  Ouverture exceptionnelle aujourd'hui{todayException.label ? `, ${todayException.label}` : ''}
                  {todayException.startTime && todayException.endTime && (
                    <span className="block text-xs opacity-80">
                      {todayException.startTime} – {todayException.endTime}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {pharmacy.isOnGuard && (
          <div className="mt-3 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5 text-sm text-violet-800">
            <strong className="flex items-center gap-1.5">
              <WarningIcon size={14} weight="fill" /> Pharmacie de garde actuellement
            </strong>
            <p className="text-xs text-violet-600 mt-0.5">
              Un passage au commissariat ou appel préalable peut être nécessaire.
            </p>
          </div>
        )}
      </div>

      {/* ── Gallery ─────────────────────────────────────────────────────── */}
      <ImageGallery images={pharmacy.images ?? []} name={pharmacy.name} />

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Left: contacts + map */}
        <div className="space-y-4">

          {/* Contacts */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <PhoneIcon size={15} weight="fill" className="text-primary" /> Contacts
            </h2>
            {contacts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {contacts.map((c, i) => (
                  <a
                    key={i}
                    href={contactHref(c)}
                    target={c.type === 'facebook' ? '_blank' : undefined}
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <ContactIcon type={c.type} />
                    <span className="flex-1">{c.label || c.value}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun contact renseigné.</p>
            )}
          </section>

          {/* Actions */}
          <Button onClick={handleNavigate} className="w-full gap-2">
            <NavigationArrowIcon size={16} weight="fill" /> Y aller, Google Maps
          </Button>
          <Button
            variant="outline"
            onClick={() => setClaimOpen(true)}
            className="w-full gap-2 text-muted-foreground"
          >
            <StorefrontIcon size={15} weight="fill" /> Je suis gérant de cette pharmacie
          </Button>

          {/* Mini-map */}
          <section className="rounded-xl border border-border overflow-hidden" style={{ height: 240 }}>
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <MiniMap
                lat={pharmacy.coordinates.lat}
                lng={pharmacy.coordinates.lng}
                name={pharmacy.name}
              />
            </Suspense>
          </section>
        </div>

        {/* Right: horaires */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ClockIcon size={15} weight="fill" className="text-primary" /> Horaires
          </h2>

          {pharmacy.isOpen24h ? (
            <div className="flex items-center gap-2 text-sky-600 font-medium py-2">
              <ClockIcon size={16} weight="fill" />
              Ouvert 24h/24, 7j/7
            </div>
          ) : sortedHours.length > 0 ? (
            <div className="space-y-1">
              {sortedHours.map((h) => {
                const isToday = new Date().getDay() === h.day;
                return (
                  <div
                    key={h.day}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                      isToday ? 'bg-primary/5 font-semibold' : ''
                    }`}
                  >
                    <span className={`w-28 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {DAYS_FULL[h.day]}
                      {isToday && <span className="ml-1.5 text-xs text-primary">(Auj.)</span>}
                    </span>
                    {h.isClosed ? (
                      <span className="text-destructive font-medium">Fermé</span>
                    ) : (
                      <span>{h.open} – {h.close}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">Horaires non renseignés.</p>
          )}
        </section>
      </div>

      {/* ── Calendrier ───────────────────────────────────────────────────── */}
      {(upcomingExceptions.length > 0 || upcomingGuards.length > 0 || pharmacyGuards.length > 0) && (
        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <CalendarDotsIcon size={15} weight="fill" className="text-primary" /> Calendrier
          </h2>

          {/* Gardes (ISO semaine) */}
          {upcomingGuards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Gardes programmées
              </p>
              {upcomingGuards.map((g) => {
                const start = new Date(g.startDate);
                const end = new Date(g.endDate);
                const isNow = now >= start && now <= end;
                return (
                  <div
                    key={g.weekIdentifier}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${
                      isNow
                        ? 'bg-violet-50 border-violet-200 text-violet-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{g.weekIdentifier}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(start, 'eee d MMM, HH:mm', { locale: fr })} →{' '}
                        {format(end, 'eee d MMM, HH:mm', { locale: fr })}
                      </p>
                    </div>
                    {isNow && (
                      <Badge className="bg-violet-600 hover:bg-violet-700 text-xs shrink-0">
                        En cours
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Gardes (plage libre déclarées par la pharmacie) */}
          {pharmacyGuards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Permanences de garde
              </p>
              {pharmacyGuards.map((g) => {
                const start = new Date(g.startDate);
                const end = new Date(g.endDate);
                const isNow = now >= start && now <= end;
                return (
                  <div
                    key={g.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${
                      isNow
                        ? 'bg-violet-50 border-violet-200 text-violet-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div>
                      {g.label && <p className="font-semibold">{g.label}</p>}
                      <p className={`text-xs ${g.label ? 'text-muted-foreground mt-0.5' : ''}`}>
                        {format(start, 'eee d MMM yyyy, HH:mm', { locale: fr })} →{' '}
                        {format(end, 'eee d MMM yyyy, HH:mm', { locale: fr })}
                      </p>
                    </div>
                    {isNow && (
                      <Badge className="bg-violet-600 hover:bg-violet-700 text-xs shrink-0">
                        En cours
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Exceptions */}
          {upcomingExceptions.length > 0 && (
            <div className="space-y-2">
              {(upcomingGuards.length > 0 || pharmacyGuards.length > 0) && <Separator />}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Horaires exceptionnels
              </p>
              {upcomingExceptions.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm border ${
                    e.type === 'closure'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  <Badge
                    className={`shrink-0 text-[10px] mt-0.5 ${
                      e.type === 'closure'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {e.type === 'closure' ? 'Fermeture' : 'Ouverture'}
                  </Badge>
                  <div>
                    <p className="font-semibold">
                      {e.startDate === e.endDate ? e.startDate : `${e.startDate} → ${e.endDate}`}
                      {e.startTime && e.endTime && (
                        <span className="font-normal ml-1.5 text-xs opacity-80">
                          {e.startTime} – {e.endTime}
                        </span>
                      )}
                    </p>
                    {(e.label || e.reason) && (
                      <p className="text-xs opacity-80 mt-0.5">{e.label ?? e.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Link to map ────────────────────────────────────────────────────*/}
      <div className="text-center pb-4">
        <Link
          to="/map"
          state={{ pharmacyId: pharmacy.id, lat: pharmacy.coordinates.lat, lng: pharmacy.coordinates.lng }}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <MapPinIcon size={14} /> Voir sur la carte
        </Link>
      </div>

      <ClaimModal
        pharmacyId={pharmacy.id}
        pharmacyName={pharmacy.name}
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PharmacyDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
