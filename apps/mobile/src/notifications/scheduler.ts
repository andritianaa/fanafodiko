import * as Notifications from 'expo-notifications';
import type { Medication } from '../types';
import { features, IS_EXPO_GO } from '../config/env';
import {
  getAllActiveMedications,
  clearScheduledNotifications,
  insertScheduledNotification,
  getTaskByMedicationAndDate,
  setSyncMeta,
  getSyncMeta,
} from '../db/database';

export const BACKGROUND_SCHEDULE_TASK = 'BACKGROUND_NOTIFICATION_SCHEDULE';
const SCHEDULE_DAYS = 30;
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// â”€â”€â”€ Notification handler (requis au top-level) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// â”€â”€â”€ Background task (dÃ©fini au top-level mÃªme en mode Expo Go) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TaskManager.defineTask DOIT Ãªtre appelÃ© au top-level du module.
// En mode Expo Go, la tÃ¢che est dÃ©finie mais jamais enregistrÃ©e (no-op safe).
let _bgTaskDefined = false;
function ensureBackgroundTaskDefined(): void {
  if (_bgTaskDefined) return;
  _bgTaskDefined = true;
  // Import dynamique pour Ã©viter le crash au dÃ©marrage en mode Expo Go
  // si expo-task-manager n'est pas disponible.
  Promise.all([
    import('expo-task-manager'),
    import('expo-background-fetch'),
  ]).then(([TaskManager, BackgroundFetch]) => {
    TaskManager.defineTask(BACKGROUND_SCHEDULE_TASK, async () => {
      try {
        const meds = await getAllActiveMedications();
        await scheduleAllNotifications(meds);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }).catch(() => {
    // Background fetch non disponible (Expo Go) â€” ignorÃ© silencieusement
  });
}

// â”€â”€â”€ Setup canal Android â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function setupNotificationChannel(): Promise<void> {
  if (!features.notificationChannels) return; // iOS / Expo Go â†’ skip
  await Notifications.setNotificationChannelAsync('medications', {
    name: 'MÃ©dicaments',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 150, 100, 150],
    lightColor: '#4f46e5',
    sound: 'default',
    description: 'Rappels de prise de mÃ©dicaments',
    enableVibrate: true,
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync('medications-urgent', {
    name: 'MÃ©dicaments (urgent)',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#DC2626',
    sound: 'default',
    description: 'Rappels urgents',
    enableVibrate: true,
    showBadge: true,
    bypassDnd: false,
  });
}

// â”€â”€â”€ Permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// â”€â”€â”€ Scheduling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function shouldScheduleForDay(med: Medication, date: Date): boolean {
  const start = new Date(med.startDate);
  start.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  if (day < start) return false;
  if (med.endDate) {
    const end = new Date(med.endDate);
    end.setHours(23, 59, 59, 999);
    if (day > end) return false;
  }
  if (med.frequency.type === 'WEEKLY') {
    const dayName = DAY_NAMES[date.getDay()];
    return med.frequency.days?.includes(dayName) ?? false;
  }
  return true;
}

export async function scheduleAllNotifications(
  medications?: Medication[]
): Promise<number> {
  if (!features.localNotifications) return 0;

  const meds = medications ?? (await getAllActiveMedications());
  const activeMeds = meds.filter((m) => m.isActive);

  await Notifications.cancelAllScheduledNotificationsAsync();
  await clearScheduledNotifications();

  const now = new Date();
  let scheduledCount = 0;

  // En mode Expo Go, on limite Ã  7 jours pour rester dans la limite iOS (64 notifs max)
  const days = IS_EXPO_GO ? 7 : SCHEDULE_DAYS;

  for (const med of activeMeds) {
    for (let d = 0; d <= days; d++) {
      const date = new Date();
      date.setDate(now.getDate() + d);

      if (!shouldScheduleForDay(med, date)) continue;

      for (const timeStr of med.frequency.times) {
        const [h, m] = timeStr.split(':').map(Number);
        const scheduledDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          h,
          m,
          0,
          0
        );

        if (scheduledDate <= now) continue;

        const existing = await getTaskByMedicationAndDate(
          med.id,
          scheduledDate.toISOString()
        );
        if (existing && (existing.status === 'TAKEN' || existing.status === 'SKIPPED')) {
          continue;
        }

        try {
          const notifId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `ðŸ’Š ${med.name}`,
              body: `${med.dosage} Â· ${timeStr}`,
              data: {
                medicationId: med.id,
                profileId: med.profileId,
                scheduledAt: scheduledDate.toISOString(),
                medName: med.name,
                medDosage: med.dosage,
              },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduledDate,
              // channelId seulement Android (ignorÃ© sur iOS)
              ...(features.notificationChannels ? { channelId: 'medications' } : {}),
            },
          });

          const rowId = `${med.id}_${scheduledDate.getTime()}`;
          await insertScheduledNotification(
            rowId,
            med.id,
            med.profileId,
            scheduledDate.toISOString(),
            notifId
          );
          scheduledCount++;
        } catch {
          // Quota iOS dÃ©passÃ© (64 notifs max) ou autre erreur â€” on s'arrÃªte proprement
          break;
        }
      }
    }
  }

  await setSyncMeta('lastNotifSchedule', now.toISOString());
  return scheduledCount;
}

export async function cancelNotificationForDose(
  medicationId: string,
  scheduledAt: string
): Promise<void> {
  const { getNotificationIdForDose } = await import('../db/database');
  const notifId = await getNotificationIdForDose(medicationId, scheduledAt);
  if (notifId) {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  }
}

export async function needsReschedule(): Promise<boolean> {
  const last = await getSyncMeta('lastNotifSchedule');
  if (!last) return true;
  const lastDate = new Date(last);
  const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
  // En Expo Go, on re-planifie plus souvent (pas de background task)
  const threshold = IS_EXPO_GO ? 1 : 12;
  return hoursSince >= threshold;
}

// â”€â”€â”€ Background task registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function registerBackgroundTask(): void {
  if (!features.backgroundScheduling) {
    if (__DEV__) console.log('[scheduler] Expo Go mode â€” background task skipped');
    return;
  }
  ensureBackgroundTaskDefined();
}

export async function startBackgroundScheduling(): Promise<void> {
  if (!features.backgroundScheduling) return;

  try {
    const [TaskManager, BackgroundFetch] = await Promise.all([
      import('expo-task-manager'),
      import('expo-background-fetch'),
    ]);

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SCHEDULE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SCHEDULE_TASK, {
        minimumInterval: 60 * 60 * 6,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (e) {
    // Non disponible dans cet environnement (simulateur, Expo Go) â€” ignorÃ©
    if (__DEV__) console.log('[scheduler] Background scheduling non disponible:', e);
  }
}
