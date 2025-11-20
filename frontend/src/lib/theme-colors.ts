/**
 * Theme Colors - Single source of truth for all colors in the application
 * Based on the new brand identity
 */

export const THEME_COLORS = {
  // Primary - Blue
  primary: {
    main: '#0062FF',
    rgb: 'rgb(0, 98, 255)',
    rgba: (opacity: number) => `rgba(0, 98, 255, ${opacity})`,
  },
  // Secondary - Light Blue
  secondary: {
    main: '#50B5FF',
    rgb: 'rgb(80, 181, 255)',
    rgba: (opacity: number) => `rgba(80, 181, 255, ${opacity})`,
  },
  // Accent - Yellow
  accent: {
    main: '#FFC542',
    rgb: 'rgb(255, 197, 66)',
    rgba: (opacity: number) => `rgba(255, 197, 66, ${opacity})`,
  },
  // Success - Green
  success: {
    main: '#3DD598',
    rgb: 'rgb(61, 213, 152)',
    rgba: (opacity: number) => `rgba(61, 213, 152, ${opacity})`,
  },
  // Danger - Red
  danger: {
    main: '#FC5A5A',
    rgb: 'rgb(252, 90, 90)',
    rgba: (opacity: number) => `rgba(252, 90, 90, ${opacity})`,
  },
  // Warning - Orange
  warning: {
    main: '#FF974A',
    rgb: 'rgb(255, 151, 74)',
    rgba: (opacity: number) => `rgba(255, 151, 74, ${opacity})`,
  },
  // Info - Light Green
  info: {
    main: '#82C43C',
    rgb: 'rgb(130, 196, 60)',
    rgba: (opacity: number) => `rgba(130, 196, 60, ${opacity})`,
  },
  // Purple
  purple: {
    main: '#A461D8',
    rgb: 'rgb(164, 97, 216)',
    rgba: (opacity: number) => `rgba(164, 97, 216, ${opacity})`,
  },
  // Pink
  pink: {
    main: '#FF9AD5',
    rgb: 'rgb(255, 154, 213)',
    rgba: (opacity: number) => `rgba(255, 154, 213, ${opacity})`,
  },
  // Neutral colors (from Tailwind theme)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

// Chart colors for analytics
export const CHART_COLORS = {
  primary: THEME_COLORS.primary.main,
  secondary: THEME_COLORS.secondary.main,
  accent: THEME_COLORS.accent.main,
  success: THEME_COLORS.success.main,
  danger: THEME_COLORS.danger.main,
  warning: THEME_COLORS.warning.main,
  info: THEME_COLORS.info.main,
  purple: THEME_COLORS.purple.main,
  pink: THEME_COLORS.pink.main,
};

// Tooltip styles for charts
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: `1px solid ${THEME_COLORS.neutral[200]}`,
  borderRadius: '8px',
};

// Node colors for flow builder
export const NODE_COLORS = {
  message: THEME_COLORS.purple.main,
  template: THEME_COLORS.purple.main,
  condition: THEME_COLORS.secondary.main,
  delay: THEME_COLORS.secondary.main,
  jump: THEME_COLORS.secondary.main,
  input: THEME_COLORS.accent.main,
  button: THEME_COLORS.accent.main,
  api: THEME_COLORS.primary.main,
  webhook: THEME_COLORS.primary.main,
  sheets: THEME_COLORS.primary.main,
  assign: THEME_COLORS.primary.main,
  tag: THEME_COLORS.primary.main,
  field: THEME_COLORS.info.main,
  start: THEME_COLORS.success.main,
};
