import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateHouseholdMemberSchema } from '@ext/schemas';
import { CameraIcon, UserIcon } from '@phosphor-icons/react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddHouseholdMember, useUpdateHouseholdMember } from '../api/hooks';
import { useUploadImage } from '../../files/api/hooks';
import { toast } from 'sonner';
import type { HouseholdMember, CreateHouseholdMemberInput } from '../types';

interface HouseholdMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: HouseholdMember;
}

export const HouseholdMemberDialog = ({
  open,
  onOpenChange,
  member,
}: HouseholdMemberDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: addMember, isPending: isAdding } = useAddHouseholdMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateHouseholdMember();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateHouseholdMemberInput>({
    resolver: zodResolver(CreateHouseholdMemberSchema),
    defaultValues: {
      fullName: '',
      relationship: '',
      avatarUrl: '',
    },
  });

  const avatarUrl = watch("avatarUrl")
  const fullName = watch("fullName")

  const displayAvatarUrl =
    avatarUrl ||
    (fullName
      ? `https://api.dicebear.com/9.x/glass/svg?seed=${fullName}`
      : undefined)

  useEffect(() => {
    if (member) {
      reset({
        fullName: member.fullName,
        relationship: member.relationship,
        avatarUrl: member.avatarUrl || '',
      });
    } else {
      reset({
        fullName: '',
        relationship: '',
        avatarUrl: '',
      });
    }
  }, [member, reset, open]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, {
        onSuccess: (data) => {
          setValue('avatarUrl', data.url);
          toast.success('Photo mise à jour');
        },
        onError: () => {
          toast.error("Échec de l'upload de l'image");
        },
      });
    }
  };

  const onSubmit = (data: CreateHouseholdMemberInput) => {
    if (isEditing && member) {
      updateMember(
        { id: member.id, data },
        {
          onSuccess: () => {
            toast.success('Membre mis à jour avec succès');
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Une erreur est survenue');
          },
        }
      );
    } else {
      addMember(data, {
        onSuccess: () => {
          toast.success('Membre ajouté avec succès');
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier le membre' : 'Ajouter un membre'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="flex flex-col items-center gap-4">
              <button 
                type="button"
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
                aria-label="Changer la photo de profil"
              >
                <Avatar className="size-24 border-4 border-primary/10 transition-transform group-hover:scale-105">
                
                  <AvatarImage src={displayAvatarUrl} alt="Avatar" />
                  <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                    {fullName ? fullName[0] : <UserIcon className="size-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="size-8 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                    <div className="size-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                  </div>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">Cliquez pour changer la photo</p>
            </div>

            <Field>
              <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
              <FieldContent>
                <Input
                  id="fullName"
                  placeholder="Alice Doe"
                  {...register('fullName')}
                />
              </FieldContent>
              <FieldError errors={[errors.fullName]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="relationship">Relation</FieldLabel>
              <FieldContent>
                <Controller
                  control={control}
                  name="relationship"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger id="relationship">
                        <SelectValue placeholder="Sélectionner une relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Moi-même</SelectItem>
                        <SelectItem value="spouse">Conjoint(e)</SelectItem>
                        <SelectItem value="child">Enfant</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Frère/Sœur</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldContent>
              <FieldError errors={[errors.relationship]} />
            </Field>

          </div>
          <DialogFooter>
            <Button type="submit" disabled={isAdding || isUpdating || isUploading}>
              {(isAdding || isUpdating) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
