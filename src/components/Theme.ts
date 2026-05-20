import { StyleSheet } from "react-native";

export const Colors = {
  // macOS system backgrounds
  background: "#F2F2F7",
  backgroundSecondary: "#FFFFFF",
  backgroundTertiary: "#F2F2F7",

  // macOS labels
  label: "#1C1C1E",
  labelSecondary: "#3C3C4399",   // 60% opacity
  labelTertiary: "#3C3C434D",    // 30% opacity
  labelQuaternary: "#3C3C4326",  // 15% opacity

  // Surfaces
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  separator: "rgba(60,60,67,0.12)",
  separatorOpaque: "#C6C6C8",

  // Apple Indigo accent (closest to SF Indigo)
  accent: "#5856D6",
  accentLight: "#5856D614",
  accentMid: "#5856D630",

  // System colors
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  teal: "#5AC8FA",
  pink: "#FF2D55",
  purple: "#AF52DE",

  // Semantic
  primary: "#5856D6",
  primaryLight: "#5856D614",
  primaryForeground: "#FFFFFF",
  destructive: "#FF3B30",
  success: "#34C759",
  successLight: "#34C75914",
  warning: "#FF9500",
  warningLight: "#FF950014",
  mutedForeground: "#8E8E93",
  muted: "#F2F2F7",
  border: "rgba(60,60,67,0.12)",
  borderStrong: "rgba(60,60,67,0.22)",
  overlay: "rgba(0,0,0,0.4)",

  // Gradients — very subtle
  gradientPrimary: ["#5856D6", "#6E6CD8"] as const,
  gradientSubtle: ["#F9F9FB", "#F2F2F7"] as const,
  pro: "#AF52DE",
  proLight: "#AF52DE14",
};

export const Shadows = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  glow: {
    shadowColor: "#5856D6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
});

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: 0.37, color: Colors.label },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: 0.36, color: Colors.label },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.35, color: Colors.label },
  title3: { fontSize: 20, fontWeight: "600" as const, letterSpacing: 0.38, color: Colors.label },
  headline: { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.41, color: Colors.label },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.41, color: Colors.label },
  callout: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.32, color: Colors.label },
  subheadline: { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.24, color: Colors.label },
  footnote: { fontSize: 13, fontWeight: "400" as const, letterSpacing: -0.08, color: Colors.mutedForeground },
  caption1: { fontSize: 12, fontWeight: "400" as const, letterSpacing: 0, color: Colors.mutedForeground },
  caption2: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.07, color: Colors.mutedForeground },
};
