import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useUpdatePharmacy } from '@/features/pharmacy/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPickerMap } from '@/features/pharmacy/components/LocationPickerMap';
import { ContactsEditor } from '@/features/backoffice/pharmacies/ContactsEditor';
import { toast } from 'sonner';
import type { PharmacyContact } from '@ext/schemas';
import type { BackofficePharmacyContext } from '../BackofficePharmacyLayout';

export default function InfoSection() {
  const { id = '' } = useParams();
  const { pharmacy } = useOutletContext<BackofficePharmacyContext>();
  const { mutate, isPending } = useUpdatePharmacy();

  const [form, setForm] = useState({
    name: pharmacy.name,
    address: pharmacy.address,
    landmark: pharmacy.landmark ?? '',
    city: pharmacy.city,
    region: pharmacy.region ?? '',
    coordinates: pharmacy.coordinates,
    contacts: (pharmacy.contacts ?? []) as PharmacyContact[],
  });

  const save = () => {
    mutate(
      { id, data: form },
      {
        onSuccess: () => toast.success('Infos mises à jour'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <div>
        <Label>Nom</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <Label>Repère visuel</Label>
        <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Ville</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label>Région</Label>
          <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Localisation</Label>
        <LocationPickerMap
          value={form.coordinates ? { lat: form.coordinates.lat ?? 0, lng: form.coordinates.lng ?? 0 } : { lat: 0, lng: 0 }}
          onChange={(coordinates) => setForm((f) => ({ ...f, coordinates }))}
          onGeocode={(geo) => setForm((f) => ({
            ...f,
            address: geo.address || f.address,
            city:    geo.city    || f.city,
            region:  geo.region  || f.region,
          }))}
        />
      </div>
      <div>
        <Label className="mb-2 block">Contacts</Label>
        <ContactsEditor
          value={form.contacts}
          onChange={(contacts) => setForm({ ...form, contacts })}
        />
      </div>
      <Button onClick={save} loading={isPending} className="w-full">
        Enregistrer les infos
      </Button>
    </div>
  );
}
