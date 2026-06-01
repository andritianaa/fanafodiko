import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, TrashIcon, PhoneIcon, EnvelopeSimpleIcon, WhatsappLogoIcon, FacebookLogoIcon, LinkIcon } from '@phosphor-icons/react';
import type { PharmacyContact, PharmacyContactType } from '@ext/schemas';

const CONTACT_TYPES: { value: PharmacyContactType; label: string; placeholder: string; icon: React.ReactNode }[] = [
  { value: 'phone', label: 'Téléphone', placeholder: '+261 20 22 XXX XX', icon: <PhoneIcon size={13} /> },
  { value: 'email', label: 'Email', placeholder: 'contact@pharmacie.mg', icon: <EnvelopeSimpleIcon size={13} /> },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: '+261 34 XX XXX XX', icon: <WhatsappLogoIcon size={13} /> },
  { value: 'facebook', label: 'Facebook', placeholder: 'facebook.com/...', icon: <FacebookLogoIcon size={13} /> },
  { value: 'other', label: 'Autre', placeholder: 'Valeur', icon: <LinkIcon size={13} /> },
];

interface Props {
  value: PharmacyContact[];
  onChange: (contacts: PharmacyContact[]) => void;
}

export function ContactsEditor({ value, onChange }: Props) {
  const contacts = value ?? [];

  const add = () =>
    onChange([...contacts, { type: 'phone', value: '' }]);

  const update = (index: number, changes: Partial<PharmacyContact>) =>
    onChange(contacts.map((c, i) => (i === index ? { ...c, ...changes } : c)));

  const remove = (index: number) =>
    onChange(contacts.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {contacts.length === 0 && (
        <p className="text-xs text-muted-foreground">Aucun contact. Ajoutez-en un.</p>
      )}
      {contacts.map((contact, i) => {
        const typeConfig = CONTACT_TYPES.find((t) => t.value === contact.type);
        return (
          <div key={i} className="flex items-center gap-2">
            <Select
              value={contact.type}
              onValueChange={(v) => update(i, { type: v as PharmacyContactType })}
            >
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-1.5">{t.icon} {t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={contact.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder={typeConfig?.placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 shrink-0"
              onClick={() => remove(i)}
            >
              <TrashIcon size={14} />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
        <PlusIcon size={14} /> Ajouter un contact
      </Button>
    </div>
  );
}
