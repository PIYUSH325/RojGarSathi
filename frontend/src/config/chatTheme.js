/**
 * Chat Messaging Platform - Design Tokens & Theme Configuration
 * Used for consistent styling across all chat components
 */

export const chatTheme = {
  // Color Palette
  colors: {
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    primaryLight: '#818cf8',
    accent: '#7c3aed',
    accentDark: '#6d28d9',
    accentLight: '#a78bfa',
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Background & Text
    bg: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      dark: '#111827',
      darkSecondary: '#1f2937',
      darkTertiary: '#374151',
    },
    
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      light: '#f9fafb',
      lightSecondary: '#e5e7eb',
    },
    
    // Message Bubbles
    messageSent: {
      bg: '#4f46e5',
      text: '#ffffff',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    },
    messageReceived: {
      bg: '#f0f1f9',
      text: '#1f2937',
      darkBg: '#374151',
      darkText: '#f3f4f6',
    },
    
    // Status Colors
    online: '#10b981',
    away: '#f59e0b',
    offline: '#9ca3af',
    
    // Borders & Dividers
    border: '#e5e7eb',
    borderDark: '#4b5563',
  },

  // Spacing System (8px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },

  // Border Radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    round: '50%',
  },

  // Typography
  typography: {
    fontFamily: {
      base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      mono: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px',
      xxxl: '24px',
      heading: '28px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(79, 70, 229, 0.2)',
  },

  // Transitions & Animations
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Breakpoints (Mobile First)
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
    ultrawide: '1920px',
  },

  // Easing Functions
  easing: {
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOutCirc: 'cubic-bezier(0, 0.55, 0.45, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-Index Stack
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    tooltip: 500,
  },
};

// Dark Mode Theme Overrides
export const darkModeTheme = {
  ...chatTheme,
  colors: {
    ...chatTheme.colors,
    bg: {
      primary: '#1f2937',
      secondary: '#111827',
      tertiary: '#374151',
      dark: '#ffffff',
      darkSecondary: '#f3f4f6',
      darkTertiary: '#e5e7eb',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      light: '#111827',
      lightSecondary: '#374151',
    },
    messageReceived: {
      bg: '#2d3748',
      text: '#e2e8f0',
      darkBg: '#f3f4f6',
      darkText: '#1f2937',
    },
  },
};

export default chatTheme;
