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

const SCREEN_HEIGHT = Dimensions.get("window").height;

// ─── PrimaryButton ────────────────────────────────────────────────────────────
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
  const heights = { sm: 38, md: 46, lg: 52 };
  const radii = { sm: 10, md: 13, lg: 16 };
  const fontSizes = { sm: 13, md: 15, lg: 16 };

  const variantStyles: Record<string, { bg: string; text: string }> = {
    filled: { bg: Colors.primary, text: "#FFF" },
    tinted: { bg: Colors.accentLight, text: Colors.primary },
    plain: { bg: "transparent", text: Colors.primary },
    destructive: { bg: Colors.destructive, text: "#FFF" },
    gray: { bg: Colors.surface, text: Colors.label },
    outline: { bg: "transparent", text: Colors.primary },
  };

  const vs = variantStyles[variant];
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.btn,
        {
          height: heights[size],
          borderRadius: radii[size],
          backgroundColor: vs.bg,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? Colors.primary : "transparent",
        },
        variant === "filled" && Shadows.glow,
        style,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <View style={styles.btnContent}>
          {icon}
          <Text style={[styles.btnText, { color: vs.text, fontSize: fontSizes[size] }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── PulsingDots ──────────────────────────────────────────────────────────────
export const PulsingDots: React.FC = () => {
  const dots = [
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
    useRef(new Animated.Value(0.25)).current,
  ];

  useEffect(() => {
    const anims = dots.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.spring(val, { toValue: 1, speed: 6, bounciness: 10, useNativeDriver: true }),
          Animated.spring(val, { toValue: 0.25, speed: 6, bounciness: 0, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d, transform: [{ scale: d }] }]} />
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
export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.primary,
  bg = Colors.accentLight,
  size = "sm",
}) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color, fontSize: size === "sm" ? 10 : 12 }]}>{label}</Text>
  </View>
);

// ─── DialogSheet ──────────────────────────────────────────────────────────────
type DialogSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
};

export const DialogSheet: React.FC<DialogSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = "92%",
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 14, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: bgAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { maxHeight, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
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
      <View style={styles.proBannerIcon}>
        <Text style={{ fontSize: 14 }}>⚡</Text>
      </View>
      <View>
        <Text style={styles.proBannerTitle}>Kredi Al</Text>
        <Text style={styles.proBannerSub}>Sınırsız belge oluştur</Text>
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
    paddingHorizontal: 20,
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 7 },
  btnText: { fontWeight: "700", letterSpacing: -0.2 },
  disabled: { opacity: 0.38 },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontWeight: "700", letterSpacing: 0.1 },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Shadows.lg,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separatorOpaque,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.label,
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.labelTertiary,
    marginTop: 3,
    letterSpacing: -0.1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: 2,
  },
  closeBtnText: { fontSize: 10, color: Colors.labelSecondary, fontWeight: "700" },
  sheetBody: { padding: 20, paddingBottom: 8 },
  sheetFooter: {
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 32 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.card,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  proBannerTitle: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  proBannerSub: { fontSize: 12, color: Colors.primary, opacity: 0.7, marginTop: 1 },
  proBannerArrow: { fontSize: 16, color: Colors.primary, fontWeight: "600" },
});
