/**
 * Theme Colors - Simplified 4-color palette
 * Primary Blue, Yellow, Light Blue, Green
 */

export const THEME_COLORS = {
  // Primary - Blue (#0062FF)
  primary: {
    main: '#0062FF',
    rgb: 'rgb(0, 98, 255)',
    rgba: (opacity: number) => `rgba(0, 98, 255, ${opacity})`,
  },
  // Secondary - Yellow (#FFC542)
  secondary: {
    main: '#FFC542',
    rgb: 'rgb(255, 197, 66)',
    rgba: (opacity: number) => `rgba(255, 197, 66, ${opacity})`,
  },
  // Accent - Light Blue (#50B5FF)
  accent: {
    main: '#50B5FF',
    rgb: 'rgb(80, 181, 255)',
    rgba: (opacity: number) => `rgba(80, 181, 255, ${opacity})`,
  },
  // Success - Green (#3DD598)
  success: {
    main: '#3DD598',
    rgb: 'rgb(61, 213, 152)',
    rgba: (opacity: number) => `rgba(61, 213, 152, ${opacity})`,
  },
  // Danger/Error - Use Primary Blue
  danger: {
    main: '#0062FF',
    rgb: 'rgb(0, 98, 255)',
    rgba: (opacity: number) => `rgba(0, 98, 255, ${opacity})`,
  },
  // Warning - Use Secondary Yellow
  warning: {
    main: '#FFC542',
    rgb: 'rgb(255, 197, 66)',
    rgba: (opacity: number) => `rgba(255, 197, 66, ${opacity})`,
  },
  // Info - Use Accent Light Blue
  info: {
    main: '#50B5FF',
    rgb: 'rgb(80, 181, 255)',
    rgba: (opacity: number) => `rgba(80, 181, 255, ${opacity})`,
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

// Chart colors for analytics - Using the 4-color palette
export const CHART_COLORS = {
  primary: THEME_COLORS.primary.main,    // #0062FF - Blue
  secondary: THEME_COLORS.secondary.main, // #FFC542 - Yellow
  accent: THEME_COLORS.accent.main,       // #50B5FF - Light Blue
  success: THEME_COLORS.success.main,     // #3DD598 - Green
  danger: THEME_COLORS.primary.main,      // #0062FF - Blue (reuse)
  warning: THEME_COLORS.secondary.main,   // #FFC542 - Yellow (reuse)
  info: THEME_COLORS.accent.main,         // #50B5FF - Light Blue (reuse)
};

// Tooltip styles for charts
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: `1px solid ${THEME_COLORS.neutral[200]}`,
  borderRadius: '8px',
};

// Node colors for flow builder - Using the 4-color palette
export const NODE_COLORS = {
  message: THEME_COLORS.primary.main,    // Blue
  template: THEME_COLORS.primary.main,   // Blue
  condition: THEME_COLORS.accent.main,   // Light Blue
  delay: THEME_COLORS.accent.main,       // Light Blue
  jump: THEME_COLORS.accent.main,        // Light Blue
  input: THEME_COLORS.secondary.main,    // Yellow
  button: THEME_COLORS.secondary.main,   // Yellow
  api: THEME_COLORS.primary.main,        // Blue
  webhook: THEME_COLORS.primary.main,    // Blue
  sheets: THEME_COLORS.primary.main,     // Blue
  assign: THEME_COLORS.primary.main,     // Blue
  tag: THEME_COLORS.primary.main,        // Blue
  field: THEME_COLORS.success.main,      // Green
  start: THEME_COLORS.success.main,      // Green
};
