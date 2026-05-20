import { StyleSheet } from "react-native";

// ── Apple Human Interface Guidelines — iOS System Colors ──────────────────────
export const Colors = {
  // Grouped backgrounds (like iOS Settings, Mail)
  bg:           "#F2F2F7",   // systemGroupedBackground
  bgSecondary:  "#FFFFFF",   // secondarySystemGroupedBackground
  bgTertiary:   "#F2F2F7",   // tertiarySystemGroupedBackground

  // Surfaces
  card:         "#FFFFFF",
  fill:         "rgba(120,120,128,0.12)",  // systemFill
  fillSecondary:"rgba(120,120,128,0.08)",
  fillTertiary: "rgba(120,120,128,0.05)",

  // Labels (exact iOS values)
  label:        "#1C1C1E",                // label
  label2:       "rgba(60,60,67,0.60)",    // secondaryLabel  → #3C3C4399
  label3:       "rgba(60,60,67,0.30)",    // tertiaryLabel   → #3C3C434D
  label4:       "rgba(60,60,67,0.16)",    // quaternaryLabel

  // Semantic aliases (backward compat)
  mutedForeground: "rgba(60,60,67,0.60)",
  labelSecondary:  "rgba(60,60,67,0.60)",
  labelTertiary:   "rgba(60,60,67,0.30)",

  // Separators
  separator:        "rgba(60,60,67,0.12)",
  separatorOpaque:  "#C6C6C8",

  // iOS System Blue — the ONE accent
  accent:      "#5856D6",   // systemIndigo (authoritative, legal)
  accentLight: "rgba(88,86,214,0.10)",
  accentMid:   "rgba(88,86,214,0.20)",

  // Aliases
  primary:        "#5856D6",
  primaryDark:    "#4442b8",
  primaryLight:   "rgba(88,86,214,0.10)",
  primaryMid:     "rgba(88,86,214,0.20)",
  primaryForeground: "#FFFFFF",

  // System palette
  blue:    "#007AFF",
  green:   "#34C759",
  red:     "#FF3B30",
  orange:  "#FF9500",
  yellow:  "#FFCC00",
  teal:    "#5AC8FA",
  pink:    "#FF2D55",
  purple:  "#AF52DE",
  indigo:  "#5856D6",

  // Semantic
  success:     "#34C759",
  successLight:"rgba(52,199,89,0.10)",
  destructive: "#FF3B30",
  warning:     "#FF9500",
  warningLight:"rgba(255,149,0,0.10)",

  redLight:    "rgba(255,59,48,0.10)",
  greenLight:  "rgba(52,199,89,0.10)",
  orangeLight: "rgba(255,149,0,0.10)",

  overlay: "rgba(0,0,0,0.36)",

  gradientPrimary: ["#5856D6", "#6E6CD8"] as const,
};

// ── Shadows — Apple uses very subtle elevation ──────────────────────────────
export const Shadows = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 5,
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
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
});

// ── Typography — SF Pro feel via Inter ─────────────────────────────────────
export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: 0.37, color: Colors.label },
  title1:     { fontSize: 28, fontWeight: "700" as const, letterSpacing: 0.34, color: Colors.label },
  title2:     { fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.35, color: Colors.label },
  title3:     { fontSize: 20, fontWeight: "600" as const, letterSpacing: 0.38, color: Colors.label },
  headline:   { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.41, color: Colors.label },
  body:       { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.41, color: Colors.label },
  callout:    { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.32, color: Colors.label },
  subhead:    { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.24, color: Colors.label },
  footnote:   { fontSize: 13, fontWeight: "400" as const, letterSpacing: -0.08, color: Colors.label2 },
  caption1:   { fontSize: 12, fontWeight: "400" as const, letterSpacing:  0.00, color: Colors.label2 },
  caption2:   { fontSize: 11, fontWeight: "400" as const, letterSpacing:  0.06, color: Colors.label3 },
};
