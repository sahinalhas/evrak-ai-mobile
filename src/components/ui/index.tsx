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
} from "react-native";
import { Colors, Shadows } from "../Theme";

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonProps = {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "filled" | "tinted" | "plain" | "destructive" | "gray";
  size?: "sm" | "md" | "lg";
  style?: object;
  textStyle?: object;
  icon?: React.ReactNode;
};

export const GradientButton: React.FC<ButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "filled",
  size = "md",
  style,
  textStyle,
  icon,
}) => {
  const heights = { sm: 36, md: 44, lg: 50 };
  const radii = { sm: 10, md: 12, lg: 14 };
  const fontSizes = { sm: 13, md: 15, lg: 16 };

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    filled: { bg: Colors.accent, text: "#FFF" },
    tinted: { bg: Colors.accentLight, text: Colors.accent },
    plain: { bg: "transparent", text: Colors.accent },
    destructive: { bg: Colors.destructive, text: "#FFF" },
    gray: { bg: Colors.muted, text: Colors.label },
  };

  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          height: heights[size],
          borderRadius: radii[size],
          backgroundColor: vs.bg,
          borderWidth: variant === "plain" ? 0 : 0,
        },
        style,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <View style={styles.btnContent}>
          {icon}
          <Text style={[styles.btnText, { color: vs.text, fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── PulsingDots ──────────────────────────────────────────────────────────────
export const PulsingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 420, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 160);
    const a3 = anim(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
      ))}
    </View>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeProps = {
  label: string;
  color?: string;
  bg?: string;
  size?: "sm" | "md";
};
export const Badge: React.FC<BadgeProps> = ({ label, color = Colors.accent, bg = Colors.accentLight, size = "sm" }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color, fontSize: size === "sm" ? 10 : 12 }]}>{label}</Text>
  </View>
);

// ─── DialogSheet ──────────────────────────────────────────────────────────────
const SCREEN_HEIGHT = Dimensions.get("window").height;

type DialogSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
};

export const DialogSheet: React.FC<DialogSheetProps> = ({ visible, onClose, title, subtitle, children, footer, maxHeight = "90%" }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 12, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: bgAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { maxHeight, transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>{children}</View>
          {footer && <View style={styles.sheetFooter}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── ProBanner ────────────────────────────────────────────────────────────────
export const ProBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.proBanner}>
    <View style={styles.proBannerLeft}>
      <View style={styles.proBannerIcon}><Text style={{ fontSize: 14 }}>⚡</Text></View>
      <View>
        <Text style={styles.proBannerTitle}>Pro'ya Geç</Text>
        <Text style={styles.proBannerSub}>Sınırsız belge & öncelikli AI</Text>
      </View>
    </View>
    <Text style={styles.proBannerArrow}>→</Text>
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  btnText: { fontWeight: "600", letterSpacing: -0.2 },
  disabled: { opacity: 0.4 },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontWeight: "600", letterSpacing: 0.1 },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Shadows.lg,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.separatorOpaque },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  sheetTitle: { fontSize: 17, fontWeight: "600", color: Colors.label, letterSpacing: -0.4 },
  sheetSubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  closeBtnText: { fontSize: 10, color: Colors.mutedForeground, fontWeight: "600" },
  sheetBody: { padding: 20 },
  sheetFooter: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },

  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.accentLight,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentMid,
  },
  proBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  proBannerIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  proBannerTitle: { fontSize: 14, fontWeight: "600", color: Colors.accent },
  proBannerSub: { fontSize: 12, color: Colors.accent, opacity: 0.7, marginTop: 1 },
  proBannerArrow: { fontSize: 16, color: Colors.accent, fontWeight: "500" },
});
