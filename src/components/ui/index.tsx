import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  Modal,
  Dimensions,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { Colors, Shadows } from "../Theme";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonProps = {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "filled" | "tinted" | "plain" | "destructive" | "gray" | "outline";
  size?: "sm" | "md" | "lg";
  style?: object;
  textStyle?: object;
  icon?: React.ReactNode;
};

export const GradientButton: React.FC<ButtonProps> = ({
  onPress, title, loading = false, disabled = false,
  variant = "filled", size = "md", style, textStyle, icon,
}) => {
  const H  = { sm: 40, md: 48, lg: 54 };
  const R  = { sm: 12, md: 14, lg: 16 };
  const FS = { sm: 14, md: 15, lg: 16 };

  const V: Record<string, { bg: string; fg: string }> = {
    filled:      { bg: Colors.accent, fg: "#FFF" },
    tinted:      { bg: Colors.accentLight, fg: Colors.accent },
    plain:       { bg: "transparent", fg: Colors.accent },
    destructive: { bg: Colors.destructive, fg: "#FFF" },
    gray:        { bg: Colors.fill, fg: Colors.label },
    outline:     { bg: "transparent", fg: Colors.accent },
  };
  const v = V[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        bStyles.btn,
        { height: H[size], borderRadius: R[size], backgroundColor: v.bg },
        variant === "filled" && Shadows.glow,
        variant === "outline" && { borderWidth: 1.5, borderColor: Colors.accent },
        style,
        (disabled || loading) && bStyles.disabled,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={v.fg} />
        : (
          <View style={bStyles.inner}>
            {icon}
            <Text style={[bStyles.text, { color: v.fg, fontSize: FS[size] }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
    </TouchableOpacity>
  );
};

const bStyles = StyleSheet.create({
  btn:      { justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  inner:    { flexDirection: "row", alignItems: "center", gap: 7 },
  text:     { fontWeight: "600", letterSpacing: -0.2 },
  disabled: { opacity: 0.36 },
});

// ─── PulsingDots ──────────────────────────────────────────────────────────────
export const PulsingDots: React.FC = () => {
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0.25)).current);

  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(v, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 5, paddingVertical: 3 }}>
      {dots.map((v, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: Colors.accent,
          opacity: v,
        }} />
      ))}
    </View>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge: React.FC<{
  label: string; color?: string; bg?: string; size?: "sm" | "md";
}> = ({ label, color = Colors.accent, bg = Colors.accentLight, size = "sm" }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
    <Text style={{ color, fontSize: size === "sm" ? 11 : 13, fontWeight: "600", letterSpacing: 0.1 }}>{label}</Text>
  </View>
);

// ─── DialogSheet ──────────────────────────────────────────────────────────────
type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
};

export const DialogSheet: React.FC<SheetProps> = ({
  visible, onClose, title, subtitle, children, footer, maxHeight = "92%",
}) => {
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const bg    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, tension: 68, friction: 13, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: SCREEN_H, duration: 280, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={sStyles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.overlay, opacity: bg }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[sStyles.sheet, { maxHeight: maxHeight as any, transform: [{ translateY: slide }] }]}>
          {/* Drag handle */}
          <View style={sStyles.handleBar}>
            <View style={sStyles.handle} />
          </View>

          {/* Header */}
          <View style={sStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={sStyles.title}>{title}</Text>
              {subtitle ? <Text style={sStyles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={sStyles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={sStyles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={sStyles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer && <View style={sStyles.footer}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
};

const sStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Shadows.lg,
    overflow: "hidden",
  },
  handleBar: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.separatorOpaque },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  title:    { fontSize: 18, fontWeight: "700", color: Colors.label, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: Colors.label3, marginTop: 3, letterSpacing: -0.1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    marginLeft: 14, marginTop: 2,
  },
  closeX: { fontSize: 10, color: Colors.label2, fontWeight: "700" },
  body:   { padding: 22, paddingBottom: 14 },
  footer: {
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 32 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.card,
  },
});

// ─── ProBanner ────────────────────────────────────────────────────────────────
export const ProBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={{
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.accentLight, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.accentMid,
  }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 16 }}>⚡</Text>
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.accent, letterSpacing: -0.2 }}>Kredi Al</Text>
        <Text style={{ fontSize: 12, color: Colors.accent, opacity: 0.65, marginTop: 1 }}>Sınırsız belge oluştur</Text>
      </View>
    </View>
    <Text style={{ fontSize: 18, color: Colors.accent, fontWeight: "300" }}>›</Text>
  </TouchableOpacity>
);
