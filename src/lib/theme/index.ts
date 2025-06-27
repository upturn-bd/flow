/**
 * Theme Configuration
 * Design system constants, colors, typography, spacing, and UI tokens
 */

// ==============================================================================
// Color Palette
// ==============================================================================

export const COLORS = {
  // Primary Colors
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Secondary Colors
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Main secondary color
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Success Colors
  SUCCESS: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main success color
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  
  // Warning Colors
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Error Colors
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Info Colors
  INFO: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main info color
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  
  // Neutral Colors
  NEUTRAL: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Semantic Colors (shortcuts)
  WHITE: '#ffffff',
  BLACK: '#000000',
  TRANSPARENT: 'transparent',
} as const;

// ==============================================================================
// Typography
// ==============================================================================

export const TYPOGRAPHY = {
  // Font Families
  FONT_FAMILY: {
    SANS: ['Inter', 'system-ui', 'sans-serif'],
    MONO: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    SERIF: ['Georgia', 'Times New Roman', 'serif'],
  },
  
  // Font Sizes (rem units)
  FONT_SIZE: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    '2XL': '1.5rem',  // 24px
    '3XL': '1.875rem', // 30px
    '4XL': '2.25rem', // 36px
    '5XL': '3rem',    // 48px
    '6XL': '3.75rem', // 60px
    '7XL': '4.5rem',  // 72px
    '8XL': '6rem',    // 96px
    '9XL': '8rem',    // 128px
  },
  
  // Font Weights
  FONT_WEIGHT: {
    THIN: '100',
    EXTRALIGHT: '200',
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
    BLACK: '900',
  },
  
  // Line Heights
  LINE_HEIGHT: {
    NONE: '1',
    TIGHT: '1.25',
    SNUG: '1.375',
    NORMAL: '1.5',
    RELAXED: '1.625',
    LOOSE: '2',
  },
  
  // Letter Spacing
  LETTER_SPACING: {
    TIGHTER: '-0.05em',
    TIGHT: '-0.025em',
    NORMAL: '0em',
    WIDE: '0.025em',
    WIDER: '0.05em',
    WIDEST: '0.1em',
  },
} as const;

// ==============================================================================
// Spacing
// ==============================================================================

export const SPACING = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
} as const;

// ==============================================================================
// Border Radius
// ==============================================================================

export const BORDER_RADIUS = {
  NONE: '0px',
  SM: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  MD: '0.375rem',   // 6px
  LG: '0.5rem',     // 8px
  XL: '0.75rem',    // 12px
  '2XL': '1rem',    // 16px
  '3XL': '1.5rem',  // 24px
  FULL: '9999px',
} as const;

// ==============================================================================
// Shadows
// ==============================================================================

export const SHADOWS = {
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2XL': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  INNER: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  NONE: '0 0 #0000',
} as const;

// ==============================================================================
// Z-Index
// ==============================================================================

export const Z_INDEX = {
  HIDE: -1,
  AUTO: 'auto',
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
  OVERLAY: 1090,
  MAX: 9999,
} as const;

// ==============================================================================
// Breakpoints
// ==============================================================================

export const BREAKPOINTS = {
  XS: '475px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// ==============================================================================
// Animation & Transitions
// ==============================================================================

export const ANIMATIONS = {
  // Duration
  DURATION: {
    INSTANT: '0ms',
    FAST: '150ms',
    NORMAL: '200ms',
    SLOW: '300ms',
    SLOWER: '500ms',
    SLOWEST: '1000ms',
  },
  
  // Timing Functions
  EASING: {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Common Transitions
  TRANSITION: {
    DEFAULT: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    COLORS: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    OPACITY: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    SHADOW: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    TRANSFORM: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ==============================================================================
// Component Specific Themes
// ==============================================================================

export const COMPONENT_THEMES = {
  // Button themes
  BUTTON: {
    PRIMARY: {
      background: COLORS.PRIMARY[500],
      backgroundHover: COLORS.PRIMARY[600],
      backgroundActive: COLORS.PRIMARY[700],
      text: COLORS.WHITE,
      border: COLORS.PRIMARY[500],
    },
    SECONDARY: {
      background: COLORS.SECONDARY[100],
      backgroundHover: COLORS.SECONDARY[200],
      backgroundActive: COLORS.SECONDARY[300],
      text: COLORS.SECONDARY[700],
      border: COLORS.SECONDARY[300],
    },
    SUCCESS: {
      background: COLORS.SUCCESS[500],
      backgroundHover: COLORS.SUCCESS[600],
      backgroundActive: COLORS.SUCCESS[700],
      text: COLORS.WHITE,
      border: COLORS.SUCCESS[500],
    },
    WARNING: {
      background: COLORS.WARNING[500],
      backgroundHover: COLORS.WARNING[600],
      backgroundActive: COLORS.WARNING[700],
      text: COLORS.WHITE,
      border: COLORS.WARNING[500],
    },
    ERROR: {
      background: COLORS.ERROR[500],
      backgroundHover: COLORS.ERROR[600],
      backgroundActive: COLORS.ERROR[700],
      text: COLORS.WHITE,
      border: COLORS.ERROR[500],
    },
  },
  
  // Form input themes
  INPUT: {
    DEFAULT: {
      background: COLORS.WHITE,
      border: COLORS.SECONDARY[300],
      borderFocus: COLORS.PRIMARY[500],
      text: COLORS.SECONDARY[900],
      placeholder: COLORS.SECONDARY[400],
    },
    ERROR: {
      border: COLORS.ERROR[500],
      borderFocus: COLORS.ERROR[600],
      text: COLORS.ERROR[700],
    },
    SUCCESS: {
      border: COLORS.SUCCESS[500],
      borderFocus: COLORS.SUCCESS[600],
      text: COLORS.SUCCESS[700],
    },
  },
  
  // Modal themes
  MODAL: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    background: COLORS.WHITE,
    border: COLORS.SECONDARY[200],
    shadow: SHADOWS.XL,
  },
  
  // Card themes
  CARD: {
    background: COLORS.WHITE,
    border: COLORS.SECONDARY[200],
    shadow: SHADOWS.SM,
    shadowHover: SHADOWS.MD,
  },
} as const;

// ==============================================================================
// Export Theme Object
// ==============================================================================

export const THEME = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  Z_INDEX,
  BREAKPOINTS,
  ANIMATIONS,
  COMPONENTS: COMPONENT_THEMES,
} as const;

export default THEME;
