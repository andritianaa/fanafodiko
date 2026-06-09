export const colors = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryLight: '#e0e7ff',
  primaryLighter: '#eef2ff',
  primaryDark: '#3730a3',

  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#fafafa',

  text: '#1C1917',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#FFFFFF',

  border: '#e5e7eb',
  divider: '#f3f4f6',

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
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  xxl: 0,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {},
  md: {},
  lg: {},
};
