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
