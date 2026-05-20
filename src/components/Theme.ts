import { StyleSheet } from "react-native";

export const Colors = {
  background: "#F5F6FA",
  backgroundCard: "#FFFFFF",
  surface: "#ECEEF5",

  label: "#12131A",
  labelSecondary: "#545672",
  labelTertiary: "#9496B0",

  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  separator: "rgba(18,19,26,0.08)",
  separatorOpaque: "#DDE0ED",

  primary: "#3B3FD8",
  primaryDark: "#2D31B3",
  primaryLight: "#3B3FD812",
  primaryMid: "#3B3FD830",

  accent: "#3B3FD8",
  accentLight: "#3B3FD810",
  accentMid: "#3B3FD828",

  indigo: "#3B3FD8",
  violet: "#7C3AED",

  blue: "#2563EB",
  green: "#059669",
  greenLight: "#05966912",
  red: "#DC2626",
  redLight: "#DC262612",
  orange: "#D97706",
  orangeLight: "#D9770612",
  yellow: "#F59E0B",
  teal: "#0891B2",
  pink: "#DB2777",
  purple: "#7C3AED",

  primary2: "#3B3FD8",
  primaryForeground: "#FFFFFF",
  destructive: "#DC2626",
  success: "#059669",
  successLight: "#05966912",
  warning: "#D97706",
  warningLight: "#D9770612",
  mutedForeground: "#9496B0",
  muted: "#ECEEF5",
  border: "rgba(18,19,26,0.08)",
  borderStrong: "rgba(18,19,26,0.16)",
  overlay: "rgba(12,13,24,0.55)",

  gradientPrimary: ["#3B3FD8", "#6366F1"] as const,
  gradientWarm: ["#4F46E5", "#7C3AED"] as const,
  gradientSubtle: ["#FFFFFF", "#F5F6FA"] as const,
  gradientHero: ["#2D31B3", "#4F46E5"] as const,
};

export const Shadows = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#12131A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: "#12131A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#12131A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: "#12131A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    shadowColor: "#12131A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  glow: {
    shadowColor: "#3B3FD8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
});

export const Typography = {
  largeTitle: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.8, color: Colors.label },
  title1: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5, color: Colors.label },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.4, color: Colors.label },
  title3: { fontSize: 18, fontWeight: "600" as const, letterSpacing: -0.3, color: Colors.label },
  headline: { fontSize: 16, fontWeight: "600" as const, letterSpacing: -0.3, color: Colors.label },
  body: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2, color: Colors.label },
  callout: { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.2, color: Colors.label },
  subheadline: { fontSize: 14, fontWeight: "400" as const, letterSpacing: -0.1, color: Colors.label },
  footnote: { fontSize: 13, fontWeight: "400" as const, letterSpacing: 0, color: Colors.mutedForeground },
  caption1: { fontSize: 12, fontWeight: "400" as const, letterSpacing: 0, color: Colors.mutedForeground },
  caption2: { fontSize: 11, fontWeight: "500" as const, letterSpacing: 0.2, color: Colors.mutedForeground },
};
