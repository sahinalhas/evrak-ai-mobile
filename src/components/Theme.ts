import { StyleSheet } from "react-native";

export const Colors = {
  bg:           "#F5F5F7",
  bgSecondary:  "#FFFFFF",
  bgTertiary:   "#F5F5F7",

  card:         "#FFFFFF",
  fill:         "rgba(0,0,0,0.05)",
  fillSecondary:"rgba(0,0,0,0.03)",
  fillTertiary: "rgba(0,0,0,0.02)",

  label:        "#0D0D0D",
  label2:       "#6B7280",
  label3:       "#A0A8B4",
  label4:       "rgba(0,0,0,0.12)",

  mutedForeground: "#6B7280",
  labelSecondary:  "#6B7280",
  labelTertiary:   "#A0A8B4",

  separator:        "rgba(0,0,0,0.06)",
  separatorOpaque:  "#E5E7EB",

  accent:      "#4F46E5",
  accentLight: "rgba(79,70,229,0.08)",
  accentMid:   "rgba(79,70,229,0.18)",

  primary:        "#4F46E5",
  primaryDark:    "#3730A3",
  primaryLight:   "rgba(79,70,229,0.08)",
  primaryMid:     "rgba(79,70,229,0.18)",
  primaryForeground: "#FFFFFF",

  blue:    "#3B82F6",
  green:   "#10B981",
  red:     "#EF4444",
  orange:  "#F59E0B",
  yellow:  "#FBBF24",
  teal:    "#14B8A6",
  pink:    "#EC4899",
  purple:  "#8B5CF6",
  indigo:  "#4F46E5",

  success:     "#10B981",
  successLight:"rgba(16,185,129,0.08)",
  destructive: "#EF4444",
  warning:     "#F59E0B",
  warningLight:"rgba(245,158,11,0.08)",

  redLight:    "rgba(239,68,68,0.08)",
  greenLight:  "rgba(16,185,129,0.08)",
  orangeLight: "rgba(245,158,11,0.08)",

  overlay: "rgba(0,0,0,0.40)",

  gradientPrimary: ["#4F46E5", "#6366F1"] as const,
};

export const Shadows = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  glow: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
});

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.5, color: Colors.label },
  title1:     { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.4, color: Colors.label },
  title2:     { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, color: Colors.label },
  title3:     { fontSize: 20, fontWeight: "600" as const, letterSpacing: -0.2, color: Colors.label },
  headline:   { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.3, color: Colors.label },
  body:       { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2, color: Colors.label },
  callout:    { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.1, color: Colors.label },
  subhead:    { fontSize: 14, fontWeight: "400" as const, letterSpacing: -0.1, color: Colors.label },
  footnote:   { fontSize: 13, fontWeight: "400" as const, letterSpacing:  0.0, color: Colors.label2 },
  caption1:   { fontSize: 12, fontWeight: "400" as const, letterSpacing:  0.0, color: Colors.label2 },
  caption2:   { fontSize: 11, fontWeight: "400" as const, letterSpacing:  0.1, color: Colors.label3 },
};
