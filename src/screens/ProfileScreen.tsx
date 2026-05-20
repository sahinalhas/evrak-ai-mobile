import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronRight,
  Shield,
  Info,
  LogOut,
  Check,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { GradientButton, DialogSheet } from "../components/ui";

const FREE_LIMIT = 8;

export const ProfileScreen: React.FC = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [quota, setQuota] = useState(FREE_LIMIT);
  const [totalDocs, setTotalDocs] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const logged = await StorageService.getUserLoggedIn();
    setSignedIn(logged);
    setQuota(await StorageService.getQuota());
    const docs = await StorageService.getDocuments();
    setTotalDocs(docs.length);
  };

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.onboarding} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}><Text style={{ fontSize: 42 }}>⚖️</Text></View>
            <Text style={styles.heroTitle}>EvrakAI</Text>
            <Text style={styles.heroSub}>
              Yapay zekâ destekli Türkçe belge asistanı.{"\n"}Dilekçe, sözleşme, ihtarname ve daha fazlası.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featureList}>
            {[
              { emoji: "📄", title: "Akıllı Belge Oluşturma", desc: "Doğal dilde tarif edin, belge saniyeler içinde hazır olsun" },
              { emoji: "🔒", title: "Gizlilik Önce", desc: "Belgeleriniz yalnızca cihazınızda saklanır" },
              { emoji: "⚡", title: "Hızlı ve Kolay", desc: "Karmaşık formlar yok. Sadece yazın, asistan halleder" },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureEmojiWrap}>
                  <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.onboardingBtns}>
            <GradientButton
              onPress={async () => { await StorageService.setUserLoggedIn(true); setSignedIn(true); }}
              title="Başla — Ücretsiz"
              size="lg"
            />
            <Text style={styles.terms}>
              Devam ederek Gizlilik Politikamızı kabul etmiş olursunuz.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  const quotaUsed = FREE_LIMIT - quota;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>EvrakAI Kullanıcısı</Text>
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>Yapay zekâ ile belge asistanı</Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
              { text: "Vazgeç", style: "cancel" },
              { text: "Çıkış", style: "destructive", onPress: async () => { await StorageService.setUserLoggedIn(false); setSignedIn(false); } },
            ])}
            style={styles.logoutBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LogOut size={16} color={Colors.mutedForeground} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { value: totalDocs, label: "Belge" },
            { value: isPro ? "∞" : quotaUsed, label: "Bu Ay" },
            { value: isPro ? "∞" : quota, label: "Kalan" },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, i < 2 && styles.statCardBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quota */}
        {!isPro && (
          <View style={styles.section}>
            <View style={styles.quotaCard}>
              <View style={styles.quotaHeader}>
                <Text style={styles.quotaTitle}>Aylık Kullanım</Text>
                <Text style={styles.quotaNumbers}>{quotaUsed} / {FREE_LIMIT}</Text>
              </View>
              <View style={styles.quotaTrack}>
                <View style={[styles.quotaFill, {
                  width: `${(quotaUsed / FREE_LIMIT) * 100}%` as any,
                  backgroundColor: quota <= 2 ? Colors.red : quota <= 4 ? Colors.orange : Colors.accent,
                }]} />
              </View>
              {quota <= 3 && (
                <Text style={styles.quotaWarn}>Krediniz azalıyor — Pro'ya geçerek sınırsız kullanın.</Text>
              )}
            </View>
          </View>
        )}

        {/* Plan */}
        {!isPro && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Plan</Text>
            <TouchableOpacity onPress={() => setPlansOpen(true)} activeOpacity={0.75} style={styles.upgradeCard}>
              <View style={styles.upgradeCardLeft}>
                <Text style={styles.upgradeCardTitle}>Pro'ya Geç</Text>
                <Text style={styles.upgradeCardDesc}>Sınırsız belge · ₺149/ay</Text>
              </View>
              <View style={styles.upgradeChevron}>
                <ChevronRight size={14} color={Colors.accent} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bilgi</Text>
          <View style={styles.menuCard}>
            {[
              {
                Icon: Shield,
                label: "Gizlilik & KVKK",
                value: "Veriler cihazda",
                onPress: () => Alert.alert("Gizlilik", "KVKK kapsamında tüm verileriniz yalnızca cihazınızın yerel depolamasında tutulur."),
              },
              {
                Icon: Info,
                label: "Hakkında",
                value: "v2.0.0",
                onPress: () => Alert.alert("EvrakAI", "Yapay zekâ destekli Türkçe belge asistanı\nVersiyon 2.0.0\n\nDesteklenen belgeler:\n• Kira Sözleşmesi\n• İstifa Dilekçesi\n• İhtarname\n• İzin Talebi\n• Kayıt Dondurma\n• Vekaletname\n• İş Sözleşmesi\n• Şikayet Dilekçesi\n• Genel Dilekçe"),
              },
            ].map((item, i) => {
              const Icon = item.Icon;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={[styles.menuRow, i < 1 && styles.menuRowDivider]}
                >
                  <View style={styles.menuIconWrap}>
                    <Icon size={16} color={Colors.accent} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuValue}>{item.value}</Text>
                  <ChevronRight size={13} color={Colors.mutedForeground} strokeWidth={1.5} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Badge */}
        <View style={styles.section}>
          <View style={styles.aiBadgeCard}>
            <View style={styles.aiBadgeIcon}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBadgeTitle}>Gerçek Yapay Zekâ</Text>
              <Text style={styles.aiBadgeDesc}>Belge oluşturma sunucu taraflı AI ile desteklenmektedir</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>EvrakAI hukuki tavsiye vermez. Avukata danışmayı ihmal etmeyin.</Text>
      </ScrollView>

      {/* Plans Sheet */}
      <DialogSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        title="Pro Plana Geç"
        subtitle="İstediğinizde iptal edebilirsiniz"
        footer={
          <GradientButton
            onPress={() => { Alert.alert("Pro", "Ödeme entegrasyonu yakında!"); setPlansOpen(false); setIsPro(true); }}
            title="Pro'ya Geç — ₺149/ay"
            size="lg"
            style={{ flex: 1 }}
          />
        }
      >
        <View style={styles.planFeatureList}>
          {[
            "Sınırsız belge oluşturma",
            "Öncelikli AI yanıt süresi",
            "Tüm belge şablonları",
            "PDF dışa aktarma",
            "WhatsApp & E-posta paylaşımı",
            "Öncelikli destek",
          ].map((f, i) => (
            <View key={i} style={styles.planFeatureRow}>
              <View style={styles.planCheck}>
                <Check size={11} color={Colors.accent} strokeWidth={3} />
              </View>
              <Text style={styles.planFeatureText}>{f}</Text>
            </View>
          ))}
          <View style={styles.priceBlock}>
            <Text style={styles.priceAmount}>₺149</Text>
            <Text style={styles.pricePeriod}>/ay</Text>
          </View>
        </View>
      </DialogSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Onboarding
  onboarding: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  heroSection: { alignItems: "center", paddingTop: 56, paddingBottom: 40 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.5, marginBottom: 10 },
  heroSub: { fontSize: 16, color: Colors.mutedForeground, textAlign: "center", lineHeight: 22, letterSpacing: -0.2 },
  featureList: { gap: 18, marginBottom: 40 },
  featureRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadows.xs,
  },
  featureEmojiWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center", justifyContent: "center",
  },
  featureTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, marginBottom: 3, letterSpacing: -0.2 },
  featureDesc: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  onboardingBtns: { gap: 14 },
  terms: { fontSize: 11, color: Colors.mutedForeground, textAlign: "center", lineHeight: 16 },

  // Profile
  scroll: { paddingBottom: 40 },
  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.accent },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 17, fontWeight: "600", color: Colors.label, letterSpacing: -0.4 },
  proBadge: { backgroundColor: Colors.purple, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  proBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  email: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  logoutBtn: { padding: 6 },

  statsRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 16,
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadows.xs,
  },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statCardBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: Colors.separator },
  statValue: { fontSize: 24, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: Colors.mutedForeground },

  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: Colors.mutedForeground, marginBottom: 8, letterSpacing: -0.1 },

  quotaCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    padding: 16, gap: 10, ...Shadows.xs,
  },
  quotaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quotaTitle: { fontSize: 14, fontWeight: "500", color: Colors.label },
  quotaNumbers: { fontSize: 13, color: Colors.mutedForeground },
  quotaTrack: { height: 4, backgroundColor: Colors.background, borderRadius: 2, overflow: "hidden" },
  quotaFill: { height: 4, borderRadius: 2 },
  quotaWarn: { fontSize: 12, color: Colors.orange, lineHeight: 17 },

  upgradeCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.accentLight, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accentMid,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  upgradeCardLeft: { flex: 1 },
  upgradeCardTitle: { fontSize: 15, fontWeight: "600", color: Colors.accent, letterSpacing: -0.2 },
  upgradeCardDesc: { fontSize: 13, color: Colors.accent, opacity: 0.7, marginTop: 2 },
  upgradeChevron: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.accentMid,
    alignItems: "center", justifyContent: "center",
  },

  menuCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    overflow: "hidden", ...Shadows.xs,
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 10 },
  menuRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  menuIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.label, letterSpacing: -0.2 },
  menuValue: { fontSize: 13, color: Colors.mutedForeground, marginRight: 4 },

  aiBadgeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.accentLight, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accentMid,
    padding: 14,
  },
  aiBadgeIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  aiBadgeTitle: { fontSize: 14, fontWeight: "600", color: Colors.accent, letterSpacing: -0.2 },
  aiBadgeDesc: { fontSize: 12, color: Colors.accent, opacity: 0.75, marginTop: 2, lineHeight: 17 },

  footer: { fontSize: 11, color: Colors.mutedForeground, textAlign: "center", marginTop: 28, paddingHorizontal: 24, lineHeight: 16 },

  planFeatureList: { gap: 12 },
  planFeatureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  planFeatureText: { fontSize: 15, color: Colors.label, letterSpacing: -0.2 },
  priceBlock: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginTop: 12 },
  priceAmount: { fontSize: 44, fontWeight: "700", color: Colors.accent, letterSpacing: -1.5 },
  pricePeriod: { fontSize: 16, color: Colors.mutedForeground, marginBottom: 10, marginLeft: 4 },
});
