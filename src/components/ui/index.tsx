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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "../Theme";

// ─── GradientButton ──────────────────────────────────────────────────────────
type GradientButtonProps = {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  style?: object;
  textStyle?: object;
  icon?: React.ReactNode;
};

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  icon,
}) => {
  const heights = { sm: 40, md: 50, lg: 56 };
  const fontSizes = { sm: 13, md: 14, lg: 15 };

  const containerStyle = [
    styles.btnBase,
    { height: heights[size], borderRadius: size === "lg" ? 18 : 14 },
    style,
    (disabled || loading) && styles.disabled,
  ];

  if (variant === "primary") {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82} style={containerStyle}>
        <LinearGradient colors={Colors.gradientPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.btnContent}>
              {icon}
              <Text style={[styles.btnText, { fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "secondary") {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82} style={[containerStyle, styles.btnSecondary]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.btnContent}>
            {icon}
            <Text style={[styles.btnTextSecondary, { fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "danger") {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82} style={[containerStyle, styles.btnDanger]}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.btnContent}>
            {icon}
            <Text style={[styles.btnText, { fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.82} style={[containerStyle, styles.btnOutline]}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <View style={styles.btnContent}>
          {icon}
          <Text style={[styles.btnTextOutline, { fontSize: fontSizes[size] }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── PulsingDots ─────────────────────────────────────────────────────────────
export const PulsingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.35, duration: 380, useNativeDriver: true }),
        ])
      );

    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 140);
    const a3 = anim(dot3, 280);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d, transform: [{ scale: d }] }]} />
      ))}
    </View>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeProps = {
  label: string;
  color?: string;
  bg?: string;
  size?: "sm" | "md";
};

export const Badge: React.FC<BadgeProps> = ({ label, color = Colors.primary, bg = Colors.primaryLight, size = "sm" }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color, fontSize: size === "sm" ? 9 : 11 }]}>{label}</Text>
  </View>
);

// ─── DialogSheet ─────────────────────────────────────────────────────────────
type DialogSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export const DialogSheet: React.FC<DialogSheetProps> = ({ visible, onClose, title, subtitle, children, footer, maxHeight = "92%" }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true }),
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
        <Animated.View style={[styles.sheetContainer, { maxHeight, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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

// ─── ProBanner ───────────────────────────────────────────────────────────────
type ProBannerProps = { onPress: () => void };
export const ProBanner: React.FC<ProBannerProps> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.proBannerContainer}>
    <LinearGradient colors={Colors.gradientHero as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.proBanner}>
      <View style={styles.proBannerLeft}>
        <Text style={styles.proBannerEmoji}>⚡</Text>
        <View>
          <Text style={styles.proBannerTitle}>Pro'ya Geç</Text>
          <Text style={styles.proBannerSub}>Sınırsız belge & öncelikli AI</Text>
        </View>
      </View>
      <View style={styles.proBannerBtn}>
        <Text style={styles.proBannerBtnText}>Yükselt →</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btnBase: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  btnSecondary: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnTextSecondary: {
    color: Colors.primary,
    fontWeight: "600",
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnTextOutline: {
    color: Colors.foreground,
    fontWeight: "600",
  },
  btnDanger: {
    backgroundColor: Colors.destructive,
  },
  disabled: { opacity: 0.48 },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
    height: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
    overflow: "hidden",
  },
  dragHandleContainer: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.foreground,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 2,
  },
  closeBtnText: {
    fontSize: 9,
    color: Colors.mutedForeground,
    fontWeight: "700",
  },
  sheetBody: { padding: 20 },
  sheetFooter: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  proBannerContainer: { marginHorizontal: 16, marginBottom: 10, borderRadius: 18, overflow: "hidden", ...Shadows.lg },
  proBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  proBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  proBannerEmoji: { fontSize: 22 },
  proBannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  proBannerSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  proBannerBtn: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  proBannerBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
