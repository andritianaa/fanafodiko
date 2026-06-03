import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreatePharmacy,
  useUpdatePharmacy,
} from "@/features/pharmacy/api/hooks";
import { OpeningHoursEditor } from "./OpeningHoursEditor";
import { ContactsEditor } from "./ContactsEditor";
import { PharmacyImagesEditor } from "./PharmacyImagesEditor";
import { LocationPickerMap } from "@/features/pharmacy/components/LocationPickerMap";
import { toast } from "sonner";
import type {
  Pharmacy,
  CreatePharmacyInput,
  OpeningHour,
  PharmacyContact,
} from "@ext/schemas";

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacy?: Pharmacy | null;
}

function defaultOpeningHours(): OpeningHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "08:00",
    close: "17:00",
    isClosed: day === 0,
  }));
}

function emptyDefaults(): CreatePharmacyInput {
  return {
    name: "",
    address: "",
    landmark: "",
    coordinates: { lat: -18.9, lng: 47.5 },
    phone: "",
    contacts: [],
    images: [],
    city: "",
    region: "",
    isOpen24h: false,
    openingHours: defaultOpeningHours(),
  };
}

export function PharmacyFormDialog({ open, onClose, pharmacy }: Props) {
  const isEdit = !!pharmacy;
  const { mutate: create, isPending: creating } = useCreatePharmacy();
  const { mutate: update, isPending: updating } = useUpdatePharmacy();
  const isPending = creating || updating;

  const { register, handleSubmit, reset, setValue, watch, control } =
    useForm<CreatePharmacyInput>({ defaultValues: emptyDefaults() });

  const isOpen24h = watch("isOpen24h");
  const coordinates = watch("coordinates");

  useEffect(() => {
    if (open) {
      reset(
        pharmacy
          ? {
              name: pharmacy.name,
              address: pharmacy.address,
              landmark: pharmacy.landmark ?? "",
              coordinates: pharmacy.coordinates,
              phone: pharmacy.phone ?? "",
              contacts: pharmacy.contacts ?? [],
              images: pharmacy.images ?? [],
              city: pharmacy.city,
              region: pharmacy.region ?? "",
              isOpen24h: pharmacy.isOpen24h,
              openingHours:
                pharmacy.openingHours?.length === 7
                  ? pharmacy.openingHours
                  : defaultOpeningHours(),
            }
          : emptyDefaults(),
      );
    }
  }, [pharmacy, open, reset]);

  const onSubmit = (data: CreatePharmacyInput) => {
    const payload = {
      ...data,
      openingHours: isOpen24h ? [] : data.openingHours,
    };
    if (isEdit && pharmacy) {
      update(
        { id: pharmacy.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Pharmacie mise à jour");
            onClose();
          },
          onError: () => toast.error("Erreur lors de la mise à jour"),
        },
      );
    } else {
      create(payload, {
        onSuccess: () => {
          toast.success("Pharmacie créée");
          onClose();
        },
        onError: () => toast.error("Erreur lors de la création"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-4xl w-full h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>
            {isEdit ? "Modifier la pharmacie" : "Nouvelle pharmacie"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0 gap-0"
        >
          <Tabs
            defaultValue="location"
            className="flex-1 flex flex-col min-h-0 px-6 pt-4"
          >
            <TabsList className="shrink-0 flex-wrap h-auto mb-1">
              <TabsTrigger value="location">Localisation</TabsTrigger>
              <TabsTrigger value="info">Infos</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="hours" disabled={isOpen24h}>
                Horaires {isOpen24h && "(24h/24)"}
              </TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            {/* ─── Localisation (carte cliquable), premier onglet ─── */}
            <TabsContent
              value="location"
              className="flex-1 overflow-y-auto space-y-3 pr-1"
            >
              <Controller
                control={control}
                name="coordinates"
                render={({ field }) => (
                  <LocationPickerMap
                    value={
                      field.value
                        ? {
                            lat: field.value.lat ?? -18.9,
                            lng: field.value.lng ?? 47.5,
                          }
                        : { lat: -18.9, lng: 47.5 }
                    }
                    onChange={field.onChange}
                    onGeocode={(geo) => {
                      if (geo.address) setValue("address", geo.address);
                      if (geo.city) setValue("city", geo.city);
                      if (geo.region) setValue("region", geo.region);
                    }}
                  />
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={coordinates?.lat ?? ""}
                    onChange={(e) =>
                      setValue("coordinates.lat", parseFloat(e.target.value))
                    }
                    placeholder="-18.9137"
                  />
                </div>
                <div>
                  <Label>Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={coordinates?.lng ?? ""}
                    onChange={(e) =>
                      setValue("coordinates.lng", parseFloat(e.target.value))
                    }
                    placeholder="47.5361"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ─── Infos générales ─── */}
            <TabsContent
              value="info"
              className="flex-1 overflow-y-auto space-y-3 pr-1"
            >
              <div>
                <Label>Nom *</Label>
                <Input
                  {...register("name", { required: true })}
                  placeholder="Pharmacie du Centre"
                />
              </div>

              <div>
                <Label>
                  Adresse
                  <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                    (auto-rempli)
                  </span>
                </Label>
                <Input
                  {...register("address")}
                  readOnly
                  className="bg-muted/40 cursor-default"
                  placeholder="Placez le marqueur sur la carte…"
                />
              </div>

              <div>
                <Label>Repère visuel</Label>
                <Input
                  {...register("landmark")}
                  placeholder="En face de l'église Saint-François"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    Ville
                    <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                      (auto-rempli)
                    </span>
                  </Label>
                  <Input {...register("city")} placeholder="Antananarivo" />
                </div>
                <div>
                  <Label>
                    Région
                    <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                      (auto-rempli)
                    </span>
                  </Label>
                  <Input {...register("region")} placeholder="Analamanga" />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1 border rounded-lg px-3">
                <Switch
                  checked={isOpen24h}
                  onCheckedChange={(v) => setValue("isOpen24h", v)}
                  id="open24h"
                />
                <Label htmlFor="open24h" className="cursor-pointer">
                  Ouvert 24h/24 (aucun horaire à saisir)
                </Label>
              </div>
            </TabsContent>

            {/* ─── Contacts multiples ─── */}
            <TabsContent
              value="contacts"
              className="flex-1 overflow-y-auto pr-1"
            >
              <p className="text-xs text-muted-foreground mb-3">
                Téléphones, emails, WhatsApp, Facebook…
              </p>
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

            {/* ─── Horaires ─── */}
            <TabsContent value="hours" className="flex-1 overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground mb-3">
                Activez/désactivez chaque jour et saisissez les horaires
                d'ouverture.
              </p>
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

            {/* ─── Images ─── */}
            <TabsContent value="images" className="flex-1 overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground mb-3">
                Photos de la devanture, de l'intérieur…
              </p>
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <PharmacyImagesEditor
                    value={field.value as string[]}
                    onChange={field.onChange}
                  />
                )}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/30 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
