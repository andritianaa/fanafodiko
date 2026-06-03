export type FrequencyType = 'DAILY' | 'WEEKLY' | 'INTERVAL';

export interface Frequency {
  type: FrequencyType;
  times: string[];
  days?: string[];
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';

export interface Task {
  id: string;
  medicationId: string;
  profileId: string;
  medicationName?: string;
  medicationDosage?: string;
  scheduledAt: string;
  status: TaskStatus;
  takenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  notificationId?: string;
}

export interface DailyStats {
  date: string;
  totalTasks: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number;
}

export type OfflineQueueAction =
  | { type: 'TAKE_TASK'; taskId: string; takenAt: string }
  | { type: 'SKIP_TASK'; taskId: string }
  | { type: 'CREATE_MEDICATION'; data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>; tempId: string }
  | { type: 'UPDATE_MEDICATION'; id: string; data: Partial<Medication> }
  | { type: 'DELETE_MEDICATION'; id: string }
  | { type: 'TOGGLE_MEDICATION'; id: string; isActive: boolean }
  | { type: 'CREATE_MEMBER'; data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>; tempId: string }
  | { type: 'UPDATE_MEMBER'; id: string; data: Partial<Profile> }
  | { type: 'DELETE_MEMBER'; id: string };

export interface QueuedAction {
  id: string;
  action: OfflineQueueAction;
  createdAt: string;
  synced: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
}

// ── Pharmacy ──────────────────────────────────────────────────────────────────

export type PharmacyContactType = 'phone' | 'email' | 'whatsapp' | 'facebook' | 'other';

export interface PharmacyContact {
  type: PharmacyContactType;
  label?: string;
  value: string;
}

export interface OpeningHour {
  day: number; // 0=Sunday … 6=Saturday
  open?: string; // "08:00"
  close?: string; // "17:00"
  isClosed: boolean;
}

export interface GuardSchedule {
  weekIdentifier: string; // "2026-W22"
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ExceptionalSchedule {
  id: string;
  type: 'opening' | 'closure';
  label?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  startTime?: string; // "HH:MM"
  endTime?: string;
  reason?: string;
}

export interface PharmacyGuard {
  id: string;
  startDate: string;
  endDate: string;
  label?: string;
  isActive: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  landmark?: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  contacts: PharmacyContact[];
  images: string[];
  city: string;
  region?: string;
  isOpen24h: boolean;
  openingHours: OpeningHour[];
  guardSchedules: GuardSchedule[];
  exceptionalSchedules: ExceptionalSchedule[];
  pharmacyGuards: PharmacyGuard[];
  isOpenNow?: boolean;
  isOnGuard?: boolean;
  updatedAt?: string;
}

export interface PharmacyMembership {
  pharmacyId: string;
  pharmacyName: string;
  role: string;
}

// ── MedSearch ─────────────────────────────────────────────────────────────────

export interface MedSearchResponse {
  pharmacyId: string;
  pharmacyName: string;
  hasStock: boolean;
  note?: string;
  distance?: number;
  respondedAt?: string;
}

export interface MedSearch {
  id: string;
  medicationName: string;
  coordinates: { lat: number; lng: number };
  radiusKm: number;
  note?: string;
  status: 'active' | 'closed';
  nearbyPharmacies: Array<{ id: string; name: string }>;
  responses: MedSearchResponse[];
  expiresAt: string;
  createdAt?: string;
}

export interface MedSearchHistoryItem {
  id: string;
  medicationName: string;
  status: 'active' | 'closed';
  nearbyPharmacies: Array<{ id: string; name: string }>;
  responses: MedSearchResponse[];
  expiresAt: string;
  createdAt?: string;
}

export interface PendingSearch {
  searchId: string;
  medicationName: string;
  note?: string;
  radiusKm: number;
  createdAt?: string;
}

// ── Notification Preferences ──────────────────────────────────────────────────

export interface NotificationPreferences {
  // Groupe : en tant qu'utilisateur
  emailMedicationReminders: boolean;
  emailPharmacyRequestDecision: boolean;
  emailBugReportUpdate: boolean;
  // Groupe : en tant que membre de pharmacie
  emailMedSearchResponse: boolean;
  emailPharmacyInvitation: boolean;
}
