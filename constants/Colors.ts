/**
 * Design system colors based on your custom OKLCH color palette.
 * These colors work with both NativeWind and traditional React Native styling.
 */

// Helper function to convert OKLCH to RGB (approximation for React Native)
function oklchToRgb(l: number, c: number, h: number): string {
  // This is a simplified conversion - for production use a proper OKLCH library
  const hueRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);
  
  // Convert Lab to RGB (simplified)
  const y = l;
  const x = a * 0.5 + y;
  const z = y - b * 0.25;
  
  const r = Math.max(0, Math.min(255, Math.round(y * 255)));
  const g = Math.max(0, Math.min(255, Math.round(x * 255)));
  const blue = Math.max(0, Math.min(255, Math.round(z * 255)));
  
  return `rgb(${r}, ${g}, ${blue})`;
}

// Design System Colors
export const DesignSystemColors = {
  light: {
    background: '#ffffff', // oklch(1 0 0)
    foreground: '#1e293b', // oklch(0.141 0.005 285.823)
    card: '#ffffff', // oklch(1 0 0)
    cardForeground: '#1e293b', // oklch(0.141 0.005 285.823)
    popover: '#ffffff', // oklch(1 0 0)
    popoverForeground: '#1e293b', // oklch(0.141 0.005 285.823)
    primary: '#16a34a', // oklch(0.723 0.219 149.579)
    primaryForeground: '#f0fdf4', // oklch(0.982 0.018 155.826)
    secondary: '#f1f5f9', // oklch(0.967 0.001 286.375)
    secondaryForeground: '#334155', // oklch(0.21 0.006 285.885)
    muted: '#f1f5f9', // oklch(0.967 0.001 286.375)
    mutedForeground: '#64748b', // oklch(0.552 0.016 285.938)
    accent: '#f1f5f9', // oklch(0.967 0.001 286.375)
    accentForeground: '#334155', // oklch(0.21 0.006 285.885)
    destructive: '#DC2626', // Dezenteres Rot statt grelles Rot
    border: '#e2e8f0', // oklch(0.92 0.004 286.32)
    input: '#e2e8f0', // oklch(0.92 0.004 286.32)
    ring: '#16a34a', // oklch(0.723 0.219 149.579)
  },
  dark: {
    background: '#0f172a', // oklch(0.141 0.005 285.823)
    foreground: '#f8fafc', // oklch(0.985 0 0)
    card: '#1e293b', // oklch(0.21 0.006 285.885)
    cardForeground: '#f8fafc', // oklch(0.985 0 0)
    popover: '#1e293b', // oklch(0.21 0.006 285.885)
    popoverForeground: '#f8fafc', // oklch(0.985 0 0)
    primary: '#22c55e', // oklch(0.696 0.17 162.48)
    primaryForeground: '#14532d', // oklch(0.393 0.095 152.535)
    secondary: '#334155', // oklch(0.274 0.006 286.033)
    secondaryForeground: '#f8fafc', // oklch(0.985 0 0)
    muted: '#334155', // oklch(0.274 0.006 286.033)
    mutedForeground: '#94a3b8', // oklch(0.705 0.015 286.067)
    accent: '#334155', // oklch(0.274 0.006 286.033)
    accentForeground: '#f8fafc', // oklch(0.985 0 0)
    destructive: '#EF4444', // Dezenteres Rot für Dark Mode
    border: 'rgba(255, 255, 255, 0.1)', // oklch(1 0 0 / 10%)
    input: 'rgba(255, 255, 255, 0.15)', // oklch(1 0 0 / 15%)
    ring: '#15803d', // oklch(0.527 0.154 150.069)
  },
};

// Legacy Colors for backward compatibility
const tintColorLight = DesignSystemColors.light.primary;
const tintColorDark = DesignSystemColors.dark.primary;

export const Colors = {
  light: {
    text: DesignSystemColors.light.foreground,
    background: DesignSystemColors.light.background,
    tint: tintColorLight,
    icon: DesignSystemColors.light.mutedForeground,
    tabIconDefault: DesignSystemColors.light.mutedForeground,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DesignSystemColors.dark.foreground,
    background: DesignSystemColors.dark.background,
    tint: tintColorDark,
    icon: DesignSystemColors.dark.mutedForeground,
    tabIconDefault: DesignSystemColors.dark.mutedForeground,
    tabIconSelected: tintColorDark,
  },
};

// Design system constants for UI components
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
