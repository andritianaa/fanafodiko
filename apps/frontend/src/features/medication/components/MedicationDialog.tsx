import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMedicationSchema } from '@ext/schemas';
import { PlusIcon, TrashIcon, PillIcon } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field';
import { DateBirthPicker } from '@/components/ui/date-birth-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHouseholdMembers } from '@/features/household/api/hooks';
import { useCreateMedication, useUpdateMedication } from '../api/hooks';
import { toast } from 'sonner';
import type { Medication, CreateMedicationInput } from '../types';
import { Checkbox } from '@/components/ui/checkbox';
import { DAYS } from '../constants';

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: Medication;
  defaultProfileId?: string;
}

interface DayCheckboxProps {
  day: typeof DAYS[number];
  value: string[];
  onChange: (value: string[]) => void;
}

const DayCheckbox = ({ day, value, onChange }: DayCheckboxProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={day.value}
      checked={value.includes(day.value)}
      onCheckedChange={(checked: boolean) => {
        const newValue = checked
          ? [...value, day.value]
          : value.filter((v: string) => v !== day.value);
        onChange(newValue);
      }}
    />
    <label
      htmlFor={day.value}
      className="text-sm font-medium leading-none cursor-pointer"
    >
      {day.label}
    </label>
  </div>
);

interface DatePickerFieldProps {
  field: {
    value: string | null | undefined;
    onChange: (value: string) => void;
  };
}

const DatePickerField = ({ field }: DatePickerFieldProps) => (
  <DateBirthPicker
    date={field.value ? new Date(field.value) : undefined}
    setDate={(date) => field.onChange(date?.toISOString() || '')}
  />
);



export const MedicationDialog = ({
  open,
  onOpenChange,
  medication,
  defaultProfileId,
}: MedicationDialogProps) => {
  const { data: members } = useHouseholdMembers();
  const { mutate: createMedication, isPending: isCreating } = useCreateMedication();
  const { mutate: updateMedication, isPending: isUpdating } = useUpdateMedication();

  const isEditing = !!medication;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateMedicationInput>({
    resolver: zodResolver(CreateMedicationSchema),
    defaultValues: {
      profileId: defaultProfileId || '',
      name: '',
      dosage: '',
      frequency: {
        type: 'DAILY',
        times: ['08:00'],
        days: [],
      },
      startDate: new Date().toISOString(),
      endDate: null,
    },
  });

  const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
    control,
    name: 'frequency.times' as never,
  });

  const frequencyType = watch('frequency.type');

  useEffect(() => {
    if (medication) {
      reset({
        profileId: medication.profileId,
        name: medication.name,
        dosage: medication.dosage,
        frequency: {
          type: medication.frequency.type,
          times: medication.frequency.times,
          days: medication.frequency.days || [],
        },
        startDate: medication.startDate,
        endDate: medication.endDate || null,
      });
    } else {
      reset({
        profileId: defaultProfileId || '',
        name: '',
        dosage: '',
        frequency: {
          type: 'DAILY',
          times: ['08:00'],
          days: [],
        },
        startDate: new Date().toISOString(),
        endDate: null,
      });
    }
  }, [medication, reset, open, defaultProfileId]);

  const onSubmit = (data: CreateMedicationInput) => {
    // Attach the browser's UTC offset so the backend converts HH:mm (local) → UTC correctly.
    // getTimezoneOffset() is negative for UTC+ zones (e.g. -180 for Madagascar UTC+3).
    const utcOffsetMinutes = new Date().getTimezoneOffset();

    if (isEditing && medication) {
      updateMedication(
        { id: medication.id, data: { ...data, utcOffsetMinutes } },
        {
          onSuccess: () => {
            toast.success('Médicament mis à jour');
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue');
          },
        }
      );
    } else {
      createMedication({ ...data, utcOffsetMinutes }, {
        onSuccess: () => {
          toast.success('Médicament ajouté');
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Une erreur est survenue');
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PillIcon className="size-6 text-primary" weight="fill" />
              {isEditing ? 'Modifier le médicament' : 'Nouveau traitement'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <Field>
              <FieldLabel htmlFor="profileId">Membre concerné</FieldLabel>
              <FieldContent>
                <Controller
                  control={control}
                  name="profileId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing || !!defaultProfileId}
                    >
                      <SelectTrigger id="profileId">
                        <SelectValue placeholder="Sélectionner un membre" />
                      </SelectTrigger>
                      <SelectContent>
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldContent>
              <FieldError errors={[errors.profileId]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="name">Nom du médicament</FieldLabel>
                <FieldContent>
                  <Input id="name" placeholder="Ex: Doliprane" {...register('name')} />
                </FieldContent>
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dosage">Dosage</FieldLabel>
                <FieldContent>
                  <Input id="dosage" placeholder="Ex: 500mg" {...register('dosage')} />
                </FieldContent>
                <FieldError errors={[errors.dosage]} />
              </Field>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4">
              <Field>
                <FieldLabel htmlFor="frequencyType">Fréquence</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="frequency.type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="frequencyType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Chaque jour</SelectItem>
                          <SelectItem value="WEEKLY">Certains jours</SelectItem>
                          <SelectItem value="INTERVAL">Intervalle</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldContent>
              </Field>

              {frequencyType === 'WEEKLY' && (
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <Controller
                      key={day.value}
                      control={control}
                      name="frequency.days"
                      render={({ field }) => (
                        <DayCheckbox 
                          day={day} 
                          value={field.value || []} 
                          onChange={field.onChange} 
                        />
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Heures de prise</p>
                <div className="grid grid-cols-2 gap-3">
                  {timeFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        type="time"
                        {...register(`frequency.times.${index}` as any)}
                        className="flex-1"
                      />
                      {timeFields.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeTime(index)}
                          className="text-destructive"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTime('08:00')}
                  className="w-full mt-2 border-dashed"
                >
                  <PlusIcon className="mr-2 size-3" />
                  Ajouter une heure
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="startDate">Date de début</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => <DatePickerField field={field} />}
                  />
                </FieldContent>
                <FieldError errors={[errors.startDate]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="endDate">Date de fin (optionnel)</FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => <DatePickerField field={field} />}
                  />
                </FieldContent>
                <FieldError errors={[errors.endDate]} />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isCreating || isUpdating} className="w-full sm:w-auto">
              {isCreating || isUpdating ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
