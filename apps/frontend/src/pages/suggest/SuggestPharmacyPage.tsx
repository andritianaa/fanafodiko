import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpeningHoursEditor } from '@/features/backoffice/pharmacies/OpeningHoursEditor';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { PharmacyImagesEditor } from '@/features/backoffice/pharmacies/PharmacyImagesEditor';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { useSubmitPharmacyRequest } from '@/features/pharmacyRequest/api/hooks';
import { toast } from 'sonner';
import type {
  CreatePharmacyRequestInput,
  OpeningHour,
  PharmacyContact,
} from '@ext/schemas';

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: '08:00',
    close: '17:00',
    isClosed: day === 0,
  }));
}

export default function SuggestPharmacyPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useSubmitPharmacyRequest();
  const [proofImages, setProofImages] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, setValue } =
    useForm<CreatePharmacyRequestInput>({
      defaultValues: {
        name: '',
        address: '',
        landmark: '',
        coordinates: { lat: -18.9, lng: 47.5 },
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="info">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="info">Infos</TabsTrigger>
                <TabsTrigger value="location">Localisation</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="hours" disabled={isOpen24h}>
                  Horaires
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-3 mt-4">
                <div>
                  <Label>Nom *</Label>
                  <Input {...register('name', { required: true })} placeholder="Pharmacie du Centre" />
                </div>
                <div>
                  <Label>Adresse *</Label>
                  <Input {...register('address', { required: true })} />
                </div>
                <div>
                  <Label>Repère visuel</Label>
                  <Input {...register('landmark')} placeholder="En face de…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ville *</Label>
                    <Input {...register('city', { required: true })} />
                  </div>
                  <div>
                    <Label>Région</Label>
                    <Input {...register('region')} />
                  </div>
                </div>
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
                  <Switch
                    checked={isOpen24h}
                    onCheckedChange={(v) => setValue('isOpen24h', v)}
                    id="o24"
                  />
                  <Label htmlFor="o24" className="cursor-pointer">Ouvert 24h/24</Label>
                </div>
              </TabsContent>

              <TabsContent value="location" className="mt-4">
                <Controller
                  control={control}
                  name="coordinates"
                  render={({ field }) => (
                    <LocationPickerMap value={field.value} onChange={field.onChange} />
                  )}
                />
              </TabsContent>

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

              <TabsContent value="hours" className="mt-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demande de gestion */}
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

        <div className="flex gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/map')}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Envoi…' : 'Envoyer la demande'}
          </Button>
        </div>
      </form>
    </div>
  );
}
