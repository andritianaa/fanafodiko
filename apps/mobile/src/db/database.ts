import * as SQLite from 'expo-sqlite';
import type { Medication, Profile, Task, OfflineQueueAction, Pharmacy } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('fanafodiko.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      dateOfBirth TEXT,
      relationship TEXT NOT NULL,
      avatarUrl TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequencyType TEXT NOT NULL,
      frequencyTimes TEXT NOT NULL,
      frequencyDays TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      medicationId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      medicationName TEXT,
      medicationDosage TEXT,
      scheduledAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      takenAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id TEXT PRIMARY KEY,
      medicationId TEXT NOT NULL,
      profileId TEXT NOT NULL,
      scheduledAt TEXT NOT NULL,
      notificationId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      actionType TEXT NOT NULL,
      actionPayload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_profile ON tasks (profileId);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks (scheduledAt);
    CREATE INDEX IF NOT EXISTS idx_medications_profile ON medications (profileId);
    CREATE INDEX IF NOT EXISTS idx_notifications_medication ON scheduled_notifications (medicationId);

    CREATE TABLE IF NOT EXISTS pharmacies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      landmark TEXT,
      city TEXT NOT NULL,
      region TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      phone TEXT,
      contacts TEXT NOT NULL DEFAULT '[]',
      images TEXT NOT NULL DEFAULT '[]',
      isOpen24h INTEGER NOT NULL DEFAULT 0,
      openingHours TEXT NOT NULL DEFAULT '[]',
      guardSchedules TEXT NOT NULL DEFAULT '[]',
      exceptionalSchedules TEXT NOT NULL DEFAULT '[]',
      pharmacyGuards TEXT NOT NULL DEFAULT '[]',
      isOpenNow INTEGER,
      isOnGuard INTEGER,
      updatedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies (city);
  `);
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function upsertProfiles(profiles: Profile[]): Promise<void> {
  const db = await getDb();
  for (const p of profiles) {
    await db.runAsync(
      `INSERT OR REPLACE INTO profiles
        (id, firstName, lastName, dateOfBirth, relationship, avatarUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.firstName, p.lastName, p.dateOfBirth ?? null, p.relationship,
       p.avatarUrl ?? null, p.createdAt ?? null, p.updatedAt ?? null]
    );
  }
}

export async function getProfiles(): Promise<Profile[]> {
  const db = await getDb();
  return db.getAllAsync<Profile>('SELECT * FROM profiles ORDER BY firstName');
}

export async function insertProfile(p: Profile): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO profiles
      (id, firstName, lastName, dateOfBirth, relationship, avatarUrl, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.firstName, p.lastName, p.dateOfBirth ?? null, p.relationship,
     p.avatarUrl ?? null, p.createdAt ?? null, p.updatedAt ?? null]
  );
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
}

// ── Medications ────────────────────────────────────────────────────────────────

function serializeMed(m: Medication): [string, string, string, string, string, string, string | null, string, string | null, number, string | null, string | null] {
  return [
    m.id, m.profileId, m.name, m.dosage,
    m.frequency.type,
    JSON.stringify(m.frequency.times),
    m.frequency.days ? JSON.stringify(m.frequency.days) : null,
    m.startDate,
    m.endDate ?? null,
    m.isActive ? 1 : 0,
    m.createdAt ?? null,
    m.updatedAt ?? null,
  ];
}

function deserializeMed(row: Record<string, string | number | null>): Medication {
  return {
    id: row.id as string,
    profileId: row.profileId as string,
    name: row.name as string,
    dosage: row.dosage as string,
    frequency: {
      type: row.frequencyType as import('../types').FrequencyType,
      times: JSON.parse(row.frequencyTimes as string),
      days: row.frequencyDays ? JSON.parse(row.frequencyDays as string) : undefined,
    },
    startDate: row.startDate as string,
    endDate: row.endDate as string | null | undefined,
    isActive: row.isActive === 1,
    createdAt: row.createdAt as string | undefined,
    updatedAt: row.updatedAt as string | undefined,
  };
}

export async function upsertMedications(meds: Medication[]): Promise<void> {
  const db = await getDb();
  for (const m of meds) {
    await db.runAsync(
      `INSERT OR REPLACE INTO medications
        (id, profileId, name, dosage, frequencyType, frequencyTimes, frequencyDays,
         startDate, endDate, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      serializeMed(m)
    );
  }
}

export async function getMedicationsByProfile(profileId: string): Promise<Medication[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, string | number | null>>(
    'SELECT * FROM medications WHERE profileId = ? ORDER BY name',
    [profileId]
  );
  return rows.map(deserializeMed);
}

export async function getAllActiveMedications(): Promise<Medication[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, string | number | null>>(
    'SELECT * FROM medications WHERE isActive = 1'
  );
  return rows.map(deserializeMed);
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
}

export async function updateMedicationStatus(id: string, isActive: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE medications SET isActive = ?, updatedAt = ? WHERE id = ?',
    [isActive ? 1 : 0, new Date().toISOString(), id]
  );
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

export async function upsertTasks(tasks: Task[]): Promise<void> {
  const db = await getDb();
  for (const t of tasks) {
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks
        (id, medicationId, profileId, medicationName, medicationDosage,
         scheduledAt, status, takenAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.medicationId, t.profileId,
       t.medicationName ?? null, t.medicationDosage ?? null,
       t.scheduledAt, t.status, t.takenAt ?? null,
       t.createdAt ?? null, t.updatedAt ?? null]
    );
  }
}

export async function getTasksByProfile(profileId: string, date?: string): Promise<Task[]> {
  const db = await getDb();
  if (date) {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    return db.getAllAsync<Task>(
      `SELECT * FROM tasks WHERE profileId = ? AND scheduledAt >= ? AND scheduledAt <= ?
       ORDER BY scheduledAt`,
      [profileId, start, end]
    );
  }
  return db.getAllAsync<Task>(
    'SELECT * FROM tasks WHERE profileId = ? ORDER BY scheduledAt DESC',
    [profileId]
  );
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const db = await getDb();
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;
  return db.getAllAsync<Task>(
    'SELECT * FROM tasks WHERE scheduledAt >= ? AND scheduledAt <= ? ORDER BY scheduledAt',
    [start, end]
  );
}

export async function updateTaskStatus(
  id: string,
  status: import('../types').TaskStatus,
  takenAt?: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET status = ?, takenAt = ?, updatedAt = ? WHERE id = ?',
    [status, takenAt ?? null, new Date().toISOString(), id]
  );
}

export async function getTaskByMedicationAndDate(
  medicationId: string,
  scheduledAt: string
): Promise<Task | null> {
  const db = await getDb();
  return db.getFirstAsync<Task>(
    'SELECT * FROM tasks WHERE medicationId = ? AND scheduledAt = ?',
    [medicationId, scheduledAt]
  );
}

// ── Scheduled Notifications ────────────────────────────────────────────────────

export async function clearScheduledNotifications(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM scheduled_notifications');
}

export async function insertScheduledNotification(
  id: string,
  medicationId: string,
  profileId: string,
  scheduledAt: string,
  notificationId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO scheduled_notifications
      (id, medicationId, profileId, scheduledAt, notificationId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, medicationId, profileId, scheduledAt, notificationId, new Date().toISOString()]
  );
}

export async function getNotificationIdForDose(
  medicationId: string,
  scheduledAt: string
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notificationId: string }>(
    'SELECT notificationId FROM scheduled_notifications WHERE medicationId = ? AND scheduledAt = ?',
    [medicationId, scheduledAt]
  );
  return row?.notificationId ?? null;
}

// ── Offline Queue ──────────────────────────────────────────────────────────────

export async function enqueueAction(action: OfflineQueueAction): Promise<void> {
  const db = await getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    `INSERT INTO offline_queue (id, actionType, actionPayload, createdAt, synced)
     VALUES (?, ?, ?, ?, 0)`,
    [id, action.type, JSON.stringify(action), new Date().toISOString()]
  );
}

export async function getPendingActions(): Promise<Array<{ id: string; action: OfflineQueueAction }>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; actionPayload: string }>(
    'SELECT id, actionPayload FROM offline_queue WHERE synced = 0 ORDER BY createdAt'
  );
  return rows.map((r) => ({ id: r.id, action: JSON.parse(r.actionPayload) as OfflineQueueAction }));
}

export async function markActionSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE offline_queue SET synced = 1 WHERE id = ?', [id]);
}

export async function clearSyncedActions(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM offline_queue WHERE synced = 1');
}

// ── Sync Metadata ──────────────────────────────────────────────────────────────

export async function getSyncMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ── Pharmacies ─────────────────────────────────────────────────────────────────

function serializePharmacy(p: Pharmacy): (string | number | null)[] {
  return [
    p.id, p.name, p.address, p.landmark ?? null, p.city, p.region ?? null,
    p.coordinates.lat, p.coordinates.lng,
    p.phone ?? null,
    JSON.stringify(p.contacts),
    JSON.stringify(p.images),
    p.isOpen24h ? 1 : 0,
    JSON.stringify(p.openingHours),
    JSON.stringify(p.guardSchedules),
    JSON.stringify(p.exceptionalSchedules),
    JSON.stringify(p.pharmacyGuards),
    p.isOpenNow != null ? (p.isOpenNow ? 1 : 0) : null,
    p.isOnGuard != null ? (p.isOnGuard ? 1 : 0) : null,
    p.updatedAt ?? null,
  ];
}

function deserializePharmacy(row: Record<string, unknown>): Pharmacy {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    landmark: row.landmark as string | undefined,
    city: row.city as string,
    region: row.region as string | undefined,
    coordinates: { lat: row.lat as number, lng: row.lng as number },
    phone: row.phone as string | undefined,
    contacts: JSON.parse(row.contacts as string),
    images: JSON.parse(row.images as string),
    isOpen24h: row.isOpen24h === 1,
    openingHours: JSON.parse(row.openingHours as string),
    guardSchedules: JSON.parse(row.guardSchedules as string),
    exceptionalSchedules: JSON.parse(row.exceptionalSchedules as string),
    pharmacyGuards: JSON.parse(row.pharmacyGuards as string),
    isOpenNow: row.isOpenNow != null ? row.isOpenNow === 1 : undefined,
    isOnGuard: row.isOnGuard != null ? row.isOnGuard === 1 : undefined,
    updatedAt: row.updatedAt as string | undefined,
  };
}

export async function upsertPharmacies(pharmacies: Pharmacy[]): Promise<void> {
  const db = await getDb();
  for (const p of pharmacies) {
    await db.runAsync(
      `INSERT OR REPLACE INTO pharmacies
        (id, name, address, landmark, city, region, lat, lng, phone,
         contacts, images, isOpen24h, openingHours, guardSchedules,
         exceptionalSchedules, pharmacyGuards, isOpenNow, isOnGuard, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      serializePharmacy(p)
    );
  }
}

export async function getPharmacies(filter?: 'open' | 'guard' | '24h'): Promise<Pharmacy[]> {
  const db = await getDb();
  let query = 'SELECT * FROM pharmacies';
  if (filter === 'open') query += ' WHERE isOpenNow = 1';
  else if (filter === 'guard') query += ' WHERE isOnGuard = 1';
  else if (filter === '24h') query += ' WHERE isOpen24h = 1';
  query += ' ORDER BY name';
  const rows = await db.getAllAsync<Record<string, unknown>>(query);
  return rows.map(deserializePharmacy);
}

export async function getPharmacyById(id: string): Promise<Pharmacy | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM pharmacies WHERE id = ?',
    [id]
  );
  return row ? deserializePharmacy(row) : null;
}

export async function searchPharmacies(q: string): Promise<Pharmacy[]> {
  const db = await getDb();
  const like = `%${q}%`;
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM pharmacies
     WHERE name LIKE ? OR city LIKE ? OR address LIKE ?
        OR landmark LIKE ? OR region LIKE ? OR contacts LIKE ?
     ORDER BY name LIMIT 50`,
    [like, like, like, like, like, like]
  );
  return rows.map(deserializePharmacy);
}
