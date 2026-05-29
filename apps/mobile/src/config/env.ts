/**
 * Feature flags basés sur les variables d'environnement.
 *
 * EXPO_PUBLIC_EXPO_GO=true  → Expo Go sur iPhone (pas de background tasks)
 * EXPO_PUBLIC_EXPO_GO=false → Dev build ou production (toutes les features)
 *
 * Pour switcher :
 *   - Dev Expo Go  : modifier .env.development → EXPO_PUBLIC_EXPO_GO=true
 *   - Dev Build    : modifier .env.development → EXPO_PUBLIC_EXPO_GO=false
 *                    puis `npx expo run:android` ou `eas build --profile development`
 */
export const IS_EXPO_GO = process.env.EXPO_PUBLIC_EXPO_GO === 'true';

/**
 * Features disponibles selon le mode
 */
export const features = {
  /** Background scheduling des notifications (expo-background-fetch) */
  backgroundScheduling: !IS_EXPO_GO,

  /** Canaux de notification Android (ignoré sur iOS de toute façon) */
  notificationChannels: !IS_EXPO_GO,

  /** SQLite local — disponible dans Expo Go et les builds natifs */
  sqlite: true,

  /** Notifications locales — disponibles dans Expo Go */
  localNotifications: true,

  /** Sync backend — toujours disponible */
  backendSync: true,
} as const;
