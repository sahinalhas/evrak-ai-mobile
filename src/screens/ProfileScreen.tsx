import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  Zap,
  FileText,
  TrendingUp,
  Shield,
  ChevronRight,
  Crown,
  Settings,
  LogOut,
  CheckCircle,
  Info,
  Key,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { GradientButton, DialogSheet, Badge } from "../components/ui";

const FREE_LIMIT = 8;

const PLANS = [
  {
    id: "free",
    name: "Ücretsiz",
    price: "₺0",
    period: "",
    features: ["8 belge/ay", "Temel şablonlar", "Sohbet geçmişi"],
    cta: "Mevcut Plan",
    isPro: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₺149",
    period: "/ay",
    features: ["Sınırsız belge", "Öncelikli AI", "Tüm şablonlar", "PDF çıktı (yakında)"],
    cta: "Pro'ya Geç",
    isPro: true,
  },
];

export const ProfileScreen: React.FC = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [quota, setQuota] = useState(FREE_LIMIT);
  const [totalDocs, setTotalDocs] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [provider, setProvider] = useState<"mock" | "gemini" | "lovable">("mock");
  const [geminiKey, setGeminiKey] = useState("");
  const [lovableKey, setLovableKey] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const logged = await StorageService.getUserLoggedIn();
    setSignedIn(logged);
    const q = await StorageService.getQuota();
    setQuota(q);
    const docs = await StorageService.getDocuments();
    setTotalDocs(docs.length);
    const keys = await StorageService.getApiKeys();
    setProvider(keys.provider);
    setGeminiKey(keys.geminiKey);
    setLovableKey(keys.lovableKey);
  };

  const handleLogin = async () => {
    await StorageService.setUserLoggedIn(true);
    setSignedIn(true);
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış", style: "destructive", onPress: async () => {
        await StorageService.setUserLoggedIn(false);
        setSignedIn(false);
      }},
    ]);
  };

  const saveApiSettings = async () => {
    setSaving(true);
    await StorageService.saveApiKeys({ provider, geminiKey, lovableKey });
    setSaving(false);
    setApiOpen(false);
    Alert.alert("✓ Kaydedildi", "API ayarlarınız güncellendi.");
  };

  const handleUpgrade = () => {
    Alert.alert("Pro Plan", "Ödeme entegrasyonu çok yakında! Erken erişim listesine eklendi.", [
      { text: "Harika!", onPress: () => { setIsPro(true); setPlansOpen(false); } },
    ]);
  };

  const quotaUsed = FREE_LIMIT - quota;
  const quotaPercent = (quota / FREE_LIMIT) * 100;

  // ── Onboarding (not signed in) ─────────────────────────────────────────────
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.onboarding} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={Colors.gradientHero as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.onboardingHero}>
            <View style={styles.onboardingIconWrap}>
              <Text style={styles.onboardingEmoji}>⚖️</Text>
            </View>
            <Text style={styles.onboardingTitle}>EvrakAI'ya Hoş Geldiniz</Text>
            <Text style={styles.onboardingSub}>
              Yapay zekâ ile saniyeler içinde hukuki, iş ve kişisel belgeler oluşturun.
            </Text>
          </LinearGradient>

          <View style={styles.onboardingFeatures}>
            {[
              { emoji: "📄", title: "Akıllı Belge Oluşturma", desc: "Dilekçe, sözleşme, ihtarname ve daha fazlası" },
              { emoji: "🤖", title: "Güçlü AI Motoru", desc: "Türkiye hukuku ve resmi yazışma kurallarına uygun" },
              { emoji: "🔒", title: "Gizlilik Önce", desc: "Belgeleriniz yalnızca cihazınızda saklanır" },
            ].map((f, i) => (
              <View key={i} style={styles.onboardingFeatureRow}>
                <View style={styles.featureEmojiBg}>
                  <Text style={styles.featureEmoji}>{f.emoji}</Text>
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.onboardingBtns}>
            <GradientButton onPress={handleLogin} title="Hemen Başla — Ücretsiz" size="lg" />
            <TouchableOpacity onPress={handleLogin} style={styles.signinLink}>
              <Text style={styles.signinLinkText}>Zaten hesabım var → Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.kvkk}>
            Devam ederek KVKK kapsamında Gizlilik Politikamızı ve Kullanım Koşullarımızı kabul etmiş olursunuz.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Logged In ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.userCard}>
          <LinearGradient colors={Colors.gradientPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>AY</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>Ahmet Yılmaz</Text>
              {isPro && <Badge label="PRO" color="#fff" bg={Colors.pro} size="sm" />}
            </View>
            <Text style={styles.userEmail}>ahmet@evrakai.com</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={15} color={Colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Toplam Belge", value: totalDocs, icon: FileText, color: Colors.primary },
            { label: "Bu Ay", value: Math.min(quotaUsed, totalDocs), icon: TrendingUp, color: Colors.success },
            { label: "Kalan Kredi", value: isPro ? "∞" : quota, icon: Zap, color: Colors.warning },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconBg, { backgroundColor: s.color + "20" }]}>
                  <Icon size={14} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Quota Bar (free users) */}
        {!isPro && (
          <View style={styles.quotaSection}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaSectionTitle}>Aylık Kredi Kullanımı</Text>
              <Text style={styles.quotaNumbers}>{quotaUsed}/{FREE_LIMIT} kullanıldı</Text>
            </View>
            <View style={styles.quotaTrack}>
              <View style={[styles.quotaFill, {
                width: `${((quotaUsed / FREE_LIMIT) * 100).toFixed(0)}%` as any,
                backgroundColor: quota <= 2 ? Colors.destructive : quota <= 4 ? Colors.warning : Colors.primary,
              }]} />
            </View>
            {quota <= 3 && (
              <Text style={styles.quotaWarn}>⚠️ Krediniz azalıyor. Pro'ya geçerek sınırsız kullanın.</Text>
            )}
          </View>
        )}

        {/* Plan Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planım</Text>
          <View style={styles.planCards}>
            {PLANS.map((plan) => {
              const active = isPro ? plan.id === "pro" : plan.id === "free";
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => plan.isPro && !isPro && setPlansOpen(true)}
                  activeOpacity={plan.isPro && !isPro ? 0.8 : 1}
                  style={[styles.planCard, active && styles.planCardActive, plan.isPro && styles.planCardPro]}
                >
                  {plan.isPro && (
                    <View style={styles.proLabel}>
                      <Crown size={10} color="#fff" />
                      <Text style={styles.proLabelText}>EN POPÜLER</Text>
                    </View>
                  )}
                  <Text style={[styles.planName, plan.isPro && styles.planNamePro]}>{plan.name}</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={[styles.planPrice, plan.isPro && styles.planPricePro]}>{plan.price}</Text>
                    {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
                  </View>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.planFeature}>
                      <CheckCircle size={11} color={plan.isPro ? Colors.pro : Colors.success} />
                      <Text style={[styles.planFeatureText, plan.isPro && styles.planFeatureTextPro]}>{f}</Text>
                    </View>
                  ))}
                  <View style={[styles.planCta, active ? styles.planCtaActive : plan.isPro ? styles.planCtaPro : styles.planCtaInactive]}>
                    <Text style={[styles.planCtaText, plan.isPro && !active ? styles.planCtaTextPro : active ? styles.planCtaTextActive : {}]}>
                      {active ? "✓ " + plan.cta : plan.cta}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar & Hesap</Text>
          <View style={styles.menuCard}>
            {[
              {
                icon: Key,
                label: "Yapay Zekâ API Ayarları",
                desc: provider === "mock" ? "Yerel Motor (Demo)" : provider === "gemini" ? "Google Gemini" : "Lovable AI",
                onPress: () => setApiOpen(true),
              },
              {
                icon: Shield,
                label: "Gizlilik & KVKK",
                desc: "Verileriniz yalnızca cihazınızda",
                onPress: () => Alert.alert("Gizlilik", "KVKK kapsamında tüm verileriniz yalnızca cihazınızın yerel depolamasında tutulur. Sunucularımıza hiçbir belge içeriği iletilmez."),
              },
              {
                icon: Info,
                label: "Hakkında",
                desc: "EvrakAI v1.0.0",
                onPress: () => Alert.alert("EvrakAI", "Yapay zekâ destekli Türkçe belge asistanı\nVersiyon 1.0.0\n\n© 2026 EvrakAI"),
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity key={i} onPress={item.onPress} activeOpacity={0.75} style={[styles.menuRow, i < 2 && styles.menuRowBorder]}>
                  <View style={styles.menuIconBg}>
                    <Icon size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={15} color={Colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.footer}>EvrakAI Mobile v1.0.0 · Yapay zekâ hukuki tavsiye vermez.</Text>
      </ScrollView>

      {/* API Settings Sheet */}
      <DialogSheet
        visible={apiOpen}
        onClose={() => setApiOpen(false)}
        title="AI Motoru Seç"
        subtitle="Tercih ettiğiniz yapay zekâ sağlayıcısını seçin"
        footer={
          <GradientButton onPress={saveApiSettings} title="Kaydet" loading={saving} style={{ flex: 1 }} />
        }
      >
        <View style={styles.apiContent}>
          {([
            { id: "mock", label: "Çevrimdışı Motor", desc: "Hızlı demo, API gerekmez", emoji: "🤖" },
            { id: "gemini", label: "Google Gemini", desc: "Kendi API Key'iniz ile", emoji: "✨" },
            { id: "lovable", label: "Lovable AI Gateway", desc: "Lovable proxy üzerinden", emoji: "💜" },
          ] as const).map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setProvider(p.id)} style={[styles.providerRow, provider === p.id && styles.providerRowActive]}>
              <Text style={styles.providerEmoji}>{p.emoji}</Text>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerLabel, provider === p.id && styles.providerLabelActive]}>{p.label}</Text>
                <Text style={styles.providerDesc}>{p.desc}</Text>
              </View>
              <View style={[styles.radio, provider === p.id && styles.radioActive]}>
                {provider === p.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {provider === "gemini" && (
            <View style={styles.keyField}>
              <Text style={styles.keyLabel}>Google Gemini API Key</Text>
              <TextInput
                value={geminiKey}
                onChangeText={setGeminiKey}
                placeholder="AIzaSy…"
                placeholderTextColor={Colors.mutedForeground}
                secureTextEntry
                style={styles.keyInput}
              />
              <Text style={styles.keyHint}>console.cloud.google.com → API & Services → Gemini API</Text>
            </View>
          )}
          {provider === "lovable" && (
            <View style={styles.keyField}>
              <Text style={styles.keyLabel}>Lovable API Key</Text>
              <TextInput
                value={lovableKey}
                onChangeText={setLovableKey}
                placeholder="lovable_key_…"
                placeholderTextColor={Colors.mutedForeground}
                secureTextEntry
                style={styles.keyInput}
              />
            </View>
          )}
        </View>
      </DialogSheet>

      {/* Plans Sheet */}
      <DialogSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        title="Pro Plana Geç"
        subtitle="Sınırsız belge ve güçlü özellikler"
        footer={
          <GradientButton onPress={handleUpgrade} title="Pro'ya Geç — ₺149/ay" size="lg" style={{ flex: 1 }} />
        }
      >
        <View style={styles.plansContent}>
          {[
            "Sınırsız belge oluşturma",
            "Öncelikli AI yanıt süresi",
            "Tüm belge şablonları",
            "PDF dışa aktarma (yakında)",
            "Belge geçmişi & arşiv",
            "Öncelikli destek",
          ].map((f, i) => (
            <View key={i} style={styles.proFeatureRow}>
              <LinearGradient colors={Colors.gradientPrimary as any} style={styles.proFeatureCheck}>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>✓</Text>
              </LinearGradient>
              <Text style={styles.proFeatureText}>{f}</Text>
            </View>
          ))}
          <View style={styles.priceHighlight}>
            <Text style={styles.priceHighlightText}>₺149</Text>
            <Text style={styles.priceHighlightSub}>/ay · İstediğinizde iptal</Text>
          </View>
        </View>
      </DialogSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  onboarding: { flexGrow: 1, paddingBottom: 32 },
  onboardingHero: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 44,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 28,
  },
  onboardingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  onboardingEmoji: { fontSize: 36 },
  onboardingTitle: { fontSize: 24, fontWeight: "700", color: "#fff", textAlign: "center" },
  onboardingSub: { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 10, lineHeight: 20, paddingHorizontal: 8 },

  onboardingFeatures: { paddingHorizontal: 24, gap: 18, marginBottom: 32 },
  onboardingFeatureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureEmojiBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: { fontSize: 20 },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: "700", color: Colors.foreground },
  featureDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },

  onboardingBtns: { paddingHorizontal: 24, gap: 12 },
  signinLink: { alignItems: "center", paddingVertical: 8 },
  signinLinkText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  kvkk: { fontSize: 10, color: Colors.mutedForeground, textAlign: "center", marginTop: 20, paddingHorizontal: 32, lineHeight: 14 },

  scrollContent: { paddingBottom: 32 },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  userInfo: { flex: 1, marginLeft: 14 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 15, fontWeight: "700", color: Colors.foreground },
  userEmail: { fontSize: 11, color: Colors.mutedForeground, marginTop: 3 },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    gap: 6,
    ...Shadows.xs,
  },
  statIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: Colors.foreground },
  statLabel: { fontSize: 9, color: Colors.mutedForeground, textAlign: "center", fontWeight: "500" },

  quotaSection: { marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, ...Shadows.xs },
  quotaHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  quotaSectionTitle: { fontSize: 13, fontWeight: "600", color: Colors.foreground },
  quotaNumbers: { fontSize: 12, color: Colors.mutedForeground },
  quotaTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  quotaFill: { height: 6, borderRadius: 3 },
  quotaWarn: { fontSize: 11, color: Colors.warningForeground, marginTop: 8, lineHeight: 15 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.mutedForeground, letterSpacing: 0.3, marginBottom: 10, marginLeft: 2 },

  planCards: { flexDirection: "row", gap: 10 },
  planCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 14,
    gap: 6,
    ...Shadows.xs,
  },
  planCardActive: { borderColor: Colors.primary, borderWidth: 1.5 },
  planCardPro: { backgroundColor: Colors.proLight, borderColor: Colors.pro },
  proLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.pro,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  proLabelText: { fontSize: 8, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  planName: { fontSize: 14, fontWeight: "700", color: Colors.foreground },
  planNamePro: { color: Colors.pro },
  planPriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  planPrice: { fontSize: 22, fontWeight: "700", color: Colors.foreground },
  planPricePro: { color: Colors.pro },
  planPeriod: { fontSize: 11, color: Colors.mutedForeground, marginBottom: 4 },
  planFeature: { flexDirection: "row", alignItems: "center", gap: 5 },
  planFeatureText: { fontSize: 11, color: Colors.mutedForeground },
  planFeatureTextPro: { color: Colors.pro },
  planCta: {
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  planCtaActive: { backgroundColor: Colors.primaryLight },
  planCtaPro: { backgroundColor: Colors.pro },
  planCtaInactive: { backgroundColor: Colors.secondary },
  planCtaText: { fontSize: 12, fontWeight: "700", color: Colors.mutedForeground },
  planCtaTextPro: { color: "#fff" },
  planCtaTextActive: { color: Colors.primary },

  menuCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, overflow: "hidden", ...Shadows.xs },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconBg: { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: 13, fontWeight: "600", color: Colors.foreground },
  menuDesc: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },

  footer: { fontSize: 10, color: Colors.mutedForeground, textAlign: "center", marginTop: 24, paddingHorizontal: 24 },

  apiContent: { gap: 10 },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 10,
  },
  providerRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  providerEmoji: { fontSize: 20 },
  providerInfo: { flex: 1 },
  providerLabel: { fontSize: 13, fontWeight: "600", color: Colors.foreground },
  providerLabelActive: { color: Colors.primary },
  providerDesc: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  keyField: { marginTop: 4, gap: 6 },
  keyLabel: { fontSize: 12, fontWeight: "600", color: Colors.foreground },
  keyInput: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.foreground,
  },
  keyHint: { fontSize: 10, color: Colors.mutedForeground },

  plansContent: { gap: 12 },
  proFeatureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  proFeatureCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  proFeatureText: { fontSize: 14, color: Colors.foreground, flex: 1 },
  priceHighlight: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginTop: 8 },
  priceHighlightText: { fontSize: 40, fontWeight: "700", color: Colors.primary },
  priceHighlightSub: { fontSize: 13, color: Colors.mutedForeground, marginBottom: 8, marginLeft: 4 },
});
