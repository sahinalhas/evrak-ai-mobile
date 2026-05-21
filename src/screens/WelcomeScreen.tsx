import React, { useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity,
  Animated, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Sparkles, FileText, Lock, Zap, ArrowRight } from "lucide-react-native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";

const { width: W, height: H } = Dimensions.get("window");

const FEATURES = [
  {
    Icon: FileText,
    iconBg: Colors.accentLight,
    iconColor: Colors.accent,
    title: "Akıllı Belge Oluşturma",
    body: "Doğal dilde anlatın, belge anında hazır olsun",
  },
  {
    Icon: Lock,
    iconBg: Colors.successLight,
    iconColor: Colors.green,
    title: "Gizlilik Önce",
    body: "Tüm veriler yalnızca cihazınızda saklanır",
  },
  {
    Icon: Zap,
    iconBg: "rgba(245,144,32,0.09)",
    iconColor: Colors.orange,
    title: "Hızlı & Kolay",
    body: "Form yok — sadece konuşun, asistan halleder",
  },
];

type Props = { onDone: () => void };

export const WelcomeScreen: React.FC<Props> = ({ onDone }) => {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(28)).current;
  const scaleIcon  = useRef(new Animated.Value(0.82)).current;
  const cardSlide  = useRef(new Animated.Value(40)).current;
  const btnScale   = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(scaleIcon, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardSlide, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.spring(btnScale,  { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleStart = async () => {
    await StorageService.setOnboardingDone();
    onDone();
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* ── Background decoration ── */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <View style={s.container}>

        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[s.logoWrap, { transform: [{ scale: scaleIcon }] }]}>
            <View style={s.logoRing} />
            <View style={s.logoMark}>
              <Sparkles size={36} color="#fff" strokeWidth={2} />
            </View>
          </Animated.View>

          <Text style={s.appName}>EvrakAI</Text>
          <Text style={s.tagline}>
            Yapay zekâ ile Türkçe{"\n"}hukuki belgeler. Saniyeler içinde.
          </Text>
        </Animated.View>

        {/* ── Feature cards ── */}
        <Animated.View style={[s.features, { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }]}>
          {FEATURES.map(({ Icon, iconBg, iconColor, title, body }, i) => (
            <View
              key={i}
              style={[s.featureRow, i < FEATURES.length - 1 && s.featureRowBorder]}
            >
              <View style={[s.featureIcon, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconColor} strokeWidth={1.9} />
              </View>
              <View style={s.featureText}>
                <Text style={s.featureTitle}>{title}</Text>
                <Text style={s.featureBody}>{body}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View style={[s.ctaWrap, { opacity: fadeAnim, transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.82}
            style={s.ctaBtn}
          >
            <Text style={s.ctaText}>Ücretsiz Başla</Text>
            <View style={s.ctaArrow}>
              <ArrowRight size={18} color={Colors.accent} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text style={s.terms}>
            Devam ederek{" "}
            <Text style={s.termsLink}>Gizlilik Politikamızı</Text>
            {" "}kabul edersiniz.
          </Text>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  bgCircle1: {
    position: "absolute",
    top: -W * 0.35,
    right: -W * 0.28,
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.425,
    backgroundColor: Colors.accentLight,
  },
  bgCircle2: {
    position: "absolute",
    bottom: H * 0.12,
    left: -W * 0.22,
    width: W * 0.6,
    height: W * 0.6,
    borderRadius: W * 0.3,
    backgroundColor: "rgba(14,165,114,0.05)",
  },

  container: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: "center",
    gap: 32,
  },

  // ── Hero
  hero: { alignItems: "center", gap: 16 },

  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 4 },
  logoRing: {
    position: "absolute",
    width: 104, height: 104, borderRadius: 30,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5, borderColor: Colors.accentMid,
  },
  logoMark: {
    width: 82, height: 82, borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    ...Shadows.glow,
  },

  appName: {
    fontSize: 38, fontWeight: "800",
    color: Colors.label, letterSpacing: -1.2,
  },
  tagline: {
    fontSize: 17, color: Colors.label2,
    textAlign: "center", lineHeight: 26,
    letterSpacing: -0.3,
  },

  // ── Features
  features: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.card,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  featureIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 15, fontWeight: "700",
    color: Colors.label, letterSpacing: -0.3, marginBottom: 2,
  },
  featureBody: {
    fontSize: 13, color: Colors.label2, lineHeight: 19,
  },

  // ── CTA
  ctaWrap: { gap: 14 },

  ctaBtn: {
    height: 58,
    backgroundColor: Colors.accent,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
    ...Shadows.glow,
  },
  ctaText: {
    fontSize: 17, fontWeight: "800",
    color: "#fff", letterSpacing: -0.4,
  },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center", justifyContent: "center",
  },

  terms: {
    fontSize: 12, color: Colors.label3,
    textAlign: "center", lineHeight: 18,
  },
  termsLink: {
    color: Colors.accent, fontWeight: "600",
  },
});
