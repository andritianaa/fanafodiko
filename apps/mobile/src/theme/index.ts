export const colors = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryLight: '#e0e7ff',
  primaryLighter: '#eef2ff',
  primaryDark: '#3730a3',

  white: '#FFFFFF',
  background: '#f5f5ff',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  text: '#1C1917',
  textSecondary: '#6366f1',
  textMuted: '#a5b4fc',
  textOnPrimary: '#FFFFFF',

  border: '#c7d2fe',
  divider: '#e0e7ff',

  success: '#16A34A',
  successLight: '#DCFCE7',
  successDark: '#166534',

  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',

  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  info: '#2563EB',
  infoLight: '#DBEAFE',

  status: {
    taken: '#16A34A',
    takenBg: '#DCFCE7',
    missed: '#DC2626',
    missedBg: '#FEE2E2',
    skipped: '#D97706',
    skippedBg: '#FEF3C7',
    pending: '#4f46e5',
    pendingBg: '#e0e7ff',
  },
};

export const typography = {
  display: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
  h1: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 26,
    lineHeight: 34,
    color: colors.text,
  },
  h2: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.text,
  },
  h3: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  bodyMedium: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  bodyBold: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  captionMedium: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  button: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.textOnPrimary,
  },
  mono: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
};
