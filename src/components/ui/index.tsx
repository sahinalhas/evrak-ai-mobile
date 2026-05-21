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
  const H  = { sm: 42, md: 50, lg: 56 };
  const R  = { sm: 13, md: 15, lg: 17 };
  const FS = { sm: 14, md: 15, lg: 16 };

  const V: Record<string, { bg: string; fg: string; border?: string }> = {
    filled:      { bg: Colors.accent, fg: "#FFF" },
    tinted:      { bg: Colors.accentLight, fg: Colors.accent },
    plain:       { bg: "transparent", fg: Colors.accent },
    destructive: { bg: Colors.destructive, fg: "#FFF" },
    gray:        { bg: Colors.fill, fg: Colors.label },
    outline:     { bg: "transparent", fg: Colors.accent, border: Colors.accent },
  };
  const v = V[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.80}
      style={[
        bStyles.btn,
        { height: H[size], borderRadius: R[size], backgroundColor: v.bg },
        variant === "filled" && Shadows.glow,
        variant === "outline" && { borderWidth: 1.5, borderColor: v.border },
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
  btn:      { justifyContent: "center", alignItems: "center", paddingHorizontal: 22 },
  inner:    { flexDirection: "row", alignItems: "center", gap: 8 },
  text:     { fontWeight: "700", letterSpacing: -0.3 },
  disabled: { opacity: 0.34 },
});

// ─── PulsingDots ──────────────────────────────────────────────────────────────
export const PulsingDots: React.FC = () => {
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0.2)).current);

  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 130),
          Animated.spring(v, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: true }),
          Animated.spring(v, { toValue: 0.2, speed: 14, bounciness: 8, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 5, paddingVertical: 4 }}>
      {dots.map((v, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: Colors.accent,
          opacity: v,
          transform: [{ scale: v }],
        }} />
      ))}
    </View>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge: React.FC<{
  label: string; color?: string; bg?: string; size?: "sm" | "md";
}> = ({ label, color = Colors.accent, bg = Colors.accentLight, size = "sm" }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 }}>
    <Text style={{ color, fontSize: size === "sm" ? 11 : 13, fontWeight: "700", letterSpacing: 0.1 }}>{label}</Text>
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
        Animated.spring(slide, { toValue: 0, tension: 72, friction: 14, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 0, duration: 200, useNativeDriver: true }),
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
          <View style={sStyles.handleBar}>
            <View style={sStyles.handle} />
          </View>

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

          <ScrollView
            style={sStyles.scrollArea}
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
    overflow: "hidden",
  },
  handleBar: { alignItems: "center", paddingTop: 14, paddingBottom: 2 },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.separatorOpaque },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  title:    { fontSize: 19, fontWeight: "800", color: Colors.label, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.label3, marginTop: 3, letterSpacing: -0.1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    marginLeft: 14, marginTop: 2,
  },
  closeX: { fontSize: 10, color: Colors.label2, fontWeight: "800" },
  scrollArea: { flexShrink: 1, flexGrow: 0 },
  body:   { padding: 22, paddingBottom: 16 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.card,
  },
});

// ─── ProBanner ────────────────────────────────────────────────────────────────
export const ProBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.80} style={{
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.accent,
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 18, padding: 16,
    ...Shadows.glow,
  }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 18 }}>⚡</Text>
      </View>
      <View>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }}>Kredi Al</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 1 }}>Sınırsız belge oluştur</Text>
      </View>
    </View>
    <View style={{
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: 14, color: "#fff", fontWeight: "700" }}>›</Text>
    </View>
  </TouchableOpacity>
);
