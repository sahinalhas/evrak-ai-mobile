import { StyleSheet, Appearance } from "react-native";

const Light = {
  background: "#f8f9fe",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#5b62f4",
  primaryGlow: "#8f5bf4",
  primaryForeground: "#ffffff",
  secondary: "#f1f5f9",
  secondaryForeground: "#1e293b",
  muted: "#f8fafc",
  mutedForeground: "#64748b",
  accent: "#eef2ff",
  accentForeground: "#3b82f6",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#10b981",
  successForeground: "#ffffff",
  warning: "#f59e0b",
  warningForeground: "#78350f",
  border: "#e2e8f0",
  input: "#f1f5f9",
  ring: "#5b62f4",
  gradientPrimary: ["#5b62f4", "#8f5bf4"] as const,
  gradientHero: ["#5b62f4", "#a25bf4"] as const,
  gradientSubtle: ["#f8f9fe", "#f1f5f9"] as const,
};

const Dark = {
  background: "#0b1220",
  foreground: "#e6eef8",
  card: "#0f1724",
  cardForeground: "#e6eef8",
  primary: "#7c86ff",
  primaryGlow: "#b58cff",
  primaryForeground: "#0f1724",
  secondary: "#0b1320",
  secondaryForeground: "#cbd5e1",
  muted: "#071021",
  mutedForeground: "#94a3b8",
  accent: "#0f172a",
  accentForeground: "#60a5fa",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#10b981",
  successForeground: "#ffffff",
  warning: "#f59e0b",
  warningForeground: "#78350f",
  border: "#162034",
  input: "#0b1320",
  ring: "#7c86ff",
  gradientPrimary: ["#5b62f4", "#8f5bf4"] as const,
  gradientHero: ["#5b62f4", "#a25bf4"] as const,
  gradientSubtle: ["#071021", "#0b1320"] as const,
};

const colorScheme = Appearance.getColorScheme();
export const Colors = colorScheme === "dark" ? Dark : Light;

export const Shadows = StyleSheet.create({
  sm: {
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  glow: {
    shadowColor: Colors.primaryGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 5,
  },
});

export const Typography = {
  h1: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: Colors.foreground,
  },
  h2: {
    fontSize: 18,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: Colors.foreground,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    color: Colors.foreground,
  },
  body: {
    fontSize: 14,
    color: Colors.foreground,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  bodySemibold: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.foreground,
    fontFamily: "Inter_600SemiBold",
  },
  caption: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  captionSemibold: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.mutedForeground,
  },
  tiny: {
    fontSize: 11,
    color: Colors.mutedForeground,
  },
};
