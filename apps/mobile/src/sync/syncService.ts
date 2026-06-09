import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authApi,
  householdsApi,
  medicationsApi,
  tasksApi,
  pharmacyApi,
  myPharmacyApi,
  ApiError,
} from "../api/client";
import {
  upsertProfiles,
  upsertMedications,
  upsertTasks,
  getMedicationsByProfile,
  getPendingActions,
  markActionSynced,
  clearSyncedActions,
  setSyncMeta,
  getSyncMeta,
  upsertPharmacies,
} from "../db/database";
import {
  scheduleAllNotifications,
  needsReschedule,
} from "../notifications/scheduler";
import { useStore } from "../store/useStore";
import type { Profile, Medication, Task, OfflineQueueAction } from "../types";

async function replayOfflineAction(action: OfflineQueueAction): Promise<void> {
  switch (action.type) {
    case "TAKE_TASK":
      await tasksApi.markTaken(action.taskId);
      break;
    case "SKIP_TASK":
      await tasksApi.markSkipped(action.taskId);
      break;
    case "CREATE_MEDICATION":
      await medicationsApi.create({
        profileId: action.data.profileId,
        name: action.data.name,
        dosage: action.data.dosage,
        frequency: action.data.frequency,
        startDate: action.data.startDate,
        endDate: action.data.endDate ?? undefined,
      });
      break;
    case "UPDATE_MEDICATION":
      await medicationsApi.update(action.id, action.data);
      break;
    case "DELETE_MEDICATION":
      await medicationsApi.remove(action.id);
      break;
    case "TOGGLE_MEDICATION":
      await medicationsApi.toggleStatus(action.id, action.isActive);
      break;
    case "CREATE_MEMBER":
      await householdsApi.create({
        firstName: action.data.firstName,
        lastName: action.data.lastName,
        dateOfBirth: action.data.dateOfBirth,
        relationship: action.data.relationship,
        avatarUrl: action.data.avatarUrl ?? undefined,
      });
      break;
    case "UPDATE_MEMBER":
      await householdsApi.update(action.id, action.data);
      break;
    case "DELETE_MEMBER":
      await householdsApi.remove(action.id);
      break;
  }
}

async function replayQueue(): Promise<void> {
  const pending = await getPendingActions();
  if (pending.length > 0) console.log(`[sync] replayQueue: ${pending.length} action(s) en attente`);
  for (const { id, action } of pending) {
    try {
      console.log(`[sync] replay action: ${action.type}`);
      await replayOfflineAction(action);
      await markActionSynced(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Ressource absente côté serveur (tâche remplacée, entrée supprimée…) — on purge proprement
        if (__DEV__) console.log(`[sync] action obsolète purgée (${action.type}): ressource introuvable`);
        await markActionSynced(id);
      } else {
        console.warn(`[sync] replay action échouée (${action.type}):`, err);
      }
    }
  }
  await clearSyncedActions();
}

async function pullProfiles(): Promise<Profile[]> {
  console.log('[sync] pullProfiles...');
  const profiles = await householdsApi.list();
  console.log(`[sync] pullProfiles: ${profiles.length} profil(s)`);
  await upsertProfiles(profiles);
  return profiles;
}

async function pullMedications(profiles: Profile[]): Promise<Medication[]> {
  const all: Medication[] = [];
  for (const profile of profiles) {
    console.log(`[sync] pullMedications profil ${profile.id}...`);
    const meds = await medicationsApi.listByProfile(profile.id);
    console.log(`[sync] pullMedications: ${meds.length} médicament(s)`);
    await upsertMedications(meds);
    all.push(...meds);
  }
  return all;
}

async function pullTasks(profiles: Profile[]): Promise<Task[]> {
  const today = new Date().toISOString().split("T")[0];
  const all: Task[] = [];
  for (const profile of profiles) {
    console.log(`[sync] pullTasks profil ${profile.id} date ${today}...`);
    const tasks = await tasksApi.list(profile.id, today);
    console.log(`[sync] pullTasks: ${tasks.length} tâche(s)`);
    await upsertTasks(tasks);
    all.push(...tasks);
  }
  return all;
}

async function pullPharmacies(): Promise<void> {
  try {
    const data = await pharmacyApi.list();
    await upsertPharmacies(data.pharmacies);
    useStore.getState().setPharmacies(data.pharmacies);
    await setSyncMeta("lastPharmacySync", Date.now().toString());
  } catch {
    // Ignore pharmacy sync errors, app works offline with cached data
  }
}

async function pullMyPharmacies(): Promise<void> {
  try {
    const pharmacies = await myPharmacyApi.list();
    useStore.getState().setMyPharmacies(pharmacies);
  } catch {
    // Not a staff user or error, silently ignore
  }
}

export async function fullSync(): Promise<{
  profiles: Profile[];
  medications: Medication[];
  tasks: Task[];
}> {
  const store = useStore.getState();

  console.log('[sync] ── fullSync START ──');

  try {
    store.setSyncing(true);

    await replayQueue();

    const profiles = await pullProfiles();
    const medications = await pullMedications(profiles);
    const tasks = await pullTasks(profiles);

    store.setProfiles(profiles);
    store.setMedications(medications);
    store.setTodayTasks(tasks);
    store.setSyncResult(true);

    await setSyncMeta("lastSync", new Date().toISOString());
    console.log('[sync] ── fullSync OK ──');

    if (await needsReschedule()) {
      const activeMeds = medications.filter((m) => m.isActive);
      await scheduleAllNotifications(activeMeds);
    }

    // Sync pharmacies once every 24h
    const lastPharmSync = await getSyncMeta("lastPharmacySync");
    if (
      !lastPharmSync ||
      Date.now() - Number(lastPharmSync) > 24 * 3600 * 1000
    ) {
      await pullPharmacies();
    }

    // Sync my pharmacies (for staff) on every full sync
    await pullMyPharmacies();

    return { profiles, medications, tasks };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur de synchronisation";
    console.error('[sync] ── fullSync ERREUR ──');
    if (err instanceof ApiError) {
      console.error(`[sync] ApiError status=${err.status} code=${err.code} message=${err.message}`);
    } else {
      console.error('[sync] Erreur inconnue:', err);
    }
    store.setSyncResult(false, message);
    throw err;
  }
}

export async function partialSync(profileId: string): Promise<void> {
  const store = useStore.getState();
  try {
    const meds = await medicationsApi.listByProfile(profileId);
    await upsertMedications(meds);

    const today = new Date().toISOString().split("T")[0];
    const tasks = await tasksApi.list(profileId, today);
    await upsertTasks(tasks);

    const allMeds = store.medications
      .filter((m) => m.profileId !== profileId)
      .concat(meds);
    store.setMedications(allMeds);

    const existingTasks = store.todayTasks.filter(
      (t) => t.profileId !== profileId,
    );
    store.setTodayTasks([...existingTasks, ...tasks]);
  } catch {}
}

export async function loadFromLocal(): Promise<void> {
  const store = useStore.getState();
  const profiles = await import("../db/database").then((m) => m.getProfiles());
  store.setProfiles(profiles);

  if (profiles.length > 0) {
    const allMeds: Medication[] = [];
    for (const p of profiles) {
      const meds = await getMedicationsByProfile(p.id);
      allMeds.push(...meds);
    }
    store.setMedications(allMeds);

    const today = new Date().toISOString().split("T")[0];
    const tasks = await import("../db/database").then((m) =>
      m.getTasksByDate(today),
    );
    store.setTodayTasks(tasks);
  }
}

export async function isTokenValid(): Promise<boolean> {
  const token = await AsyncStorage.getItem("auth_token");
  if (!token) return false;
  try {
    await authApi.me();
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await AsyncStorage.removeItem("auth_token");
      useStore.getState().clearAuth();
      return false;
    }
    return true;
  }
}
