import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { OpeningHoursEditor } from '@/features/backoffice/pharmacies/OpeningHoursEditor';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { PharmacyImagesEditor } from '@/features/backoffice/pharmacies/PharmacyImagesEditor';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { useSubmitPharmacyRequest } from '@/features/pharmacyRequest/api/hooks';
import { toast } from 'sonner';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type {
  CreatePharmacyRequestInput,
  OpeningHour,
  PharmacyContact,
} from '@ext/schemas';

// ─── Ordre des étapes ──────────────────────────────────────────────────────────
const STEPS = ['location', 'info', 'contacts', 'hours'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  location: 'Localisation',
  info: 'Infos',
  contacts: 'Contacts',
  hours: 'Horaires',
};

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuggestPharmacyPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useSubmitPharmacyRequest();
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('location');

  const { register, handleSubmit, control, watch, setValue } =
    useForm<CreatePharmacyRequestInput>({
      defaultValues: {
        name: '',
        address: '',
        landmark: '',
        coordinates: { lat: 0, lng: 0 },
        contacts: [],
        city: '',
        region: '',
        isOpen24h: false,
        openingHours: defaultOpeningHours(),
        wantsToManage: false,
        proofImages: [],
      },
    });

  const isOpen24h = watch('isOpen24h');
  const wantsToManage = watch('wantsToManage');

  const currentIndex = STEPS.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (!isLast) setCurrentStep(STEPS[currentIndex + 1]);
  };
  const goPrev = () => {
    if (!isFirst) setCurrentStep(STEPS[currentIndex - 1]);
  };

  const onSubmit = (data: CreatePharmacyRequestInput) => {
    if (data.wantsToManage && proofImages.length === 0) {
      toast.error('Ajoutez au moins un justificatif pour gérer la pharmacie');
      return;
    }
    const payload: CreatePharmacyRequestInput = {
      ...data,
      openingHours: isOpen24h ? [] : data.openingHours,
      proofImages,
    };
    mutate(payload, {
      onSuccess: () => {
        toast.success('Demande envoyée ! Elle sera examinée par notre équipe.');
        navigate('/map');
      },
      onError: () => toast.error("Échec de l'envoi de la demande"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Suggérer une pharmacie</h1>
        <p className="text-muted-foreground text-sm">
          Aidez la communauté en ajoutant une pharmacie manquante. Notre équipe
          vérifiera les informations avant publication.
        </p>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((step, i) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(step)}
              className={`font-medium transition-colors ${
                step === currentStep
                  ? 'text-primary'
                  : i < currentIndex
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {i + 1}. {STEP_LABELS[step]}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as Step)}>

              {/* ── Étape 1 : Localisation ── */}
              <TabsContent value="location" className="mt-4">
                <Controller
                  control={control}
                  name="coordinates"
                  render={({ field }) => (
                    <LocationPickerMap
                      value={field.value ? { lat: field.value.lat ?? 0, lng: field.value.lng ?? 0 } : { lat: 0, lng: 0 }}
                      onChange={field.onChange}
                      onGeocode={(geo) => {
                        if (geo.address) setValue('address', geo.address);
                        if (geo.city)    setValue('city', geo.city);
                        if (geo.region)  setValue('region', geo.region);
                      }}
                    />
                  )}
                />
              </TabsContent>

              {/* ── Étape 2 : Infos ── */}
              <TabsContent value="info" className="space-y-3 mt-4">
                <div>
                  <Label>Nom *</Label>
                  <Input
                    {...register('name', { required: true })}
                    placeholder="Pharmacie du Centre"
                  />
                </div>
                <div>
                  <Label>
                    Adresse
                    <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">(auto-rempli)</span>
                  </Label>
                  <Input
                    {...register('address')}
                    readOnly
                    className="bg-muted/40 cursor-default"
                    placeholder="Sera rempli automatiquement…"
                  />
                </div>
                <div>
                  <Label>Repère visuel</Label>
                  <Input {...register('landmark')} placeholder="En face de…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>
                      Ville
                      <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">(auto-rempli)</span>
                    </Label>
                    <Input {...register('city')} placeholder="Antananarivo" />
                  </div>
                  <div>
                    <Label>
                      Région
                      <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">(auto-rempli)</span>
                    </Label>
                    <Input {...register('region')} placeholder="Analamanga" />
                  </div>
                </div>
              </TabsContent>

              {/* ── Étape 3 : Contacts ── */}
              <TabsContent value="contacts" className="mt-4">
                <Controller
                  control={control}
                  name="contacts"
                  render={({ field }) => (
                    <ContactsEditor
                      value={field.value as PharmacyContact[]}
                      onChange={field.onChange}
                    />
                  )}
                />
              </TabsContent>

              {/* ── Étape 4 : Horaires ── */}
              <TabsContent value="hours" className="mt-4 space-y-4">
                {/* Ouvert 24h/24 déplacé ici */}
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
                  <Switch
                    checked={isOpen24h}
                    onCheckedChange={(v) => setValue('isOpen24h', v)}
                    id="o24"
                  />
                  <Label htmlFor="o24" className="cursor-pointer">Ouvert 24h/24</Label>
                </div>
                {!isOpen24h && (
                  <Controller
                    control={control}
                    name="openingHours"
                    render={({ field }) => (
                      <OpeningHoursEditor
                        value={field.value as OpeningHour[]}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demande de gestion (visible sur toutes les étapes) */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Gérer cette pharmacie ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
              <Switch
                checked={wantsToManage}
                onCheckedChange={(v) => setValue('wantsToManage', v)}
                id="manage"
              />
              <Label htmlFor="manage" className="cursor-pointer">
                Je suis le gérant de cette pharmacie
              </Label>
            </div>

            {wantsToManage && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ajoutez des justificatifs (licence, registre de commerce, carte
                  professionnelle…). Ils seront vérifiés par notre équipe.
                </p>
                <PharmacyImagesEditor
                  value={proofImages}
                  onChange={setProofImages}
                  max={5}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Navigation bas de page ── */}
        <div className="flex gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={isFirst ? () => navigate('/map') : goPrev}
            className="gap-1.5"
          >
            <CaretLeftIcon size={15} />
            {isFirst ? 'Annuler' : 'Précédent'}
          </Button>

          {isLast ? (
            <Button type="submit" loading={isPending} className="flex-1">
              Envoyer la demande
            </Button>
          ) : (
            <Button type="button" onClick={goNext} className="flex-1 gap-1.5">
              Suivant
              <CaretRightIcon size={15} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
