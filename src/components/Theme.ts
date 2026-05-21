import { StyleSheet } from "react-native";

export const Colors = {
  bg:           "#F7F7FB",
  bgSecondary:  "#FFFFFF",
  bgTertiary:   "#F0F0F8",

  card:         "#FFFFFF",
  fill:         "rgba(100,100,120,0.07)",
  fillSecondary:"rgba(100,100,120,0.04)",
  fillTertiary: "rgba(100,100,120,0.02)",

  label:        "#0A0A12",
  label2:       "#60657A",
  label3:       "#9EA5BC",
  label4:       "rgba(10,10,18,0.10)",

  mutedForeground: "#60657A",
  labelSecondary:  "#60657A",
  labelTertiary:   "#9EA5BC",

  separator:        "rgba(100,100,140,0.09)",
  separatorOpaque:  "#E4E5EF",

  accent:      "#5B4CF5",
  accentLight: "rgba(91,76,245,0.07)",
  accentMid:   "rgba(91,76,245,0.16)",

  primary:        "#5B4CF5",
  primaryDark:    "#3D2FD6",
  primaryLight:   "rgba(91,76,245,0.07)",
  primaryMid:     "rgba(91,76,245,0.16)",
  primaryForeground: "#FFFFFF",

  blue:    "#3B82F6",
  green:   "#0EA572",
  red:     "#E83A3A",
  orange:  "#F59020",
  yellow:  "#FBBF24",
  teal:    "#0CB8AA",
  pink:    "#E93D8B",
  purple:  "#8B5CF6",
  indigo:  "#5B4CF5",
  violet:  "#7C3AED",

  success:     "#0EA572",
  successLight:"rgba(14,165,114,0.08)",
  destructive: "#E83A3A",
  warning:     "#F59020",
  warningLight:"rgba(245,144,32,0.09)",

  redLight:    "rgba(232,58,58,0.08)",
  greenLight:  "rgba(14,165,114,0.08)",
  orangeLight: "rgba(245,144,32,0.09)",

  overlay: "rgba(5,5,20,0.48)",

  gradientPrimary:  ["#5B4CF5", "#8B5CF6"] as const,
  gradientSurface:  ["#FFFFFF", "#F7F7FB"] as const,
};

export const Shadows = StyleSheet.create({
  none: {},
  xs: {
    shadowColor: "#1A0E6E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: "#1A0E6E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: "#1A0E6E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1A0E6E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 6,
  },
  card: {
    shadowColor: "#1A0E6E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  glow: {
    shadowColor: "#5B4CF5",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  glowSm: {
    shadowColor: "#5B4CF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
});

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.8, color: Colors.label },
  title1:     { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.6, color: Colors.label },
  title2:     { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.4, color: Colors.label },
  title3:     { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, color: Colors.label },
  headline:   { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.3, color: Colors.label },
  body:       { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2, color: Colors.label },
  callout:    { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.15, color: Colors.label },
  subhead:    { fontSize: 14, fontWeight: "400" as const, letterSpacing: -0.1, color: Colors.label },
  footnote:   { fontSize: 13, fontWeight: "400" as const, letterSpacing:  0.0, color: Colors.label2 },
  caption1:   { fontSize: 12, fontWeight: "400" as const, letterSpacing:  0.0, color: Colors.label2 },
  caption2:   { fontSize: 11, fontWeight: "400" as const, letterSpacing:  0.1, color: Colors.label3 },
};
