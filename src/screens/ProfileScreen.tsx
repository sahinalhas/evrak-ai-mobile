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
  ShoppingCart,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { GradientButton, DialogSheet } from "../components/ui";

export const ProfileScreen: React.FC = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [credits, setCredits] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("p3");

  const CREDIT_PACKAGES = [
    { id: "p1", label: "1 Belge", credits: 1, price: "₺29", priceNum: 29, badge: null },
    { id: "p3", label: "3 Belge Paketi", credits: 3, price: "₺59", priceNum: 59, badge: "Popüler" },
    { id: "p10", label: "10 Belge Paketi", credits: 10, price: "₺129", priceNum: 129, badge: "En İyi Değer" },
  ];

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const logged = await StorageService.getUserLoggedIn();
    setSignedIn(logged);
    setCredits(await StorageService.getCredits());
    const docs = await StorageService.getDocuments();
    setTotalDocs(docs.length);
  };

  const handleBuyCredits = async () => {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === selectedPkg)!;
    const next = await StorageService.addCredits(pkg.credits);
    setCredits(next);
    setBuyOpen(false);
    Alert.alert("Çok Yakında", `Uygulama içi satın alma özelliği çok yakında aktif olacak. ${pkg.credits} deneme kredisi hesabınıza eklendi.`);
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
            { value: credits, label: "Kredi" },
            { value: credits === 0 ? "—" : "∞", label: "Süre" },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, i < 2 && styles.statCardBorder]}>
              <Text style={[styles.statValue, i === 1 && credits === 0 && { color: Colors.red }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Credits section */}
        <View style={styles.section}>
          <View style={styles.creditCard}>
            <View style={styles.creditCardLeft}>
              <Text style={styles.creditCardTitle}>
                {credits === 0 ? "Krediniz bitti" : `${credits} belge kredisi mevcut`}
              </Text>
              <Text style={styles.creditCardDesc}>
                {credits === 0
                  ? "Belge oluşturmak için kredi satın alın"
                  : "Krediler süresiz geçerlidir · belge başına 1 kredi düşer"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setBuyOpen(true)} activeOpacity={0.75} style={styles.creditBuyBtn}>
              <ShoppingCart size={14} color="#fff" strokeWidth={2} />
              <Text style={styles.creditBuyBtnText}>Kredi Al</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fiyatlandırma</Text>
          <View style={styles.pricingCard}>
            {[
              { label: "1 Belge", price: "₺29", sub: "Tek seferlik" },
              { label: "3 Belge Paketi", price: "₺59", sub: "Belge başı ₺20 — %32 ucuz", highlight: true },
              { label: "10 Belge Paketi", price: "₺129", sub: "Belge başı ₺13 — %55 ucuz" },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setBuyOpen(true)}
                activeOpacity={0.75}
                style={[styles.pricingRow, i < 2 && styles.pricingRowDivider, item.highlight && styles.pricingRowHighlight]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pricingLabel, item.highlight && styles.pricingLabelHighlight]}>{item.label}</Text>
                  <Text style={styles.pricingSub}>{item.sub}</Text>
                </View>
                <Text style={[styles.pricingPrice, item.highlight && styles.pricingPriceHighlight]}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

      {/* Buy Credits Sheet */}
      <DialogSheet
        visible={buyOpen}
        onClose={() => setBuyOpen(false)}
        title="Belge Kredisi Al"
        subtitle="1 kredi = 1 belge oluşturma hakkı"
        footer={
          <GradientButton
            onPress={handleBuyCredits}
            title={`Devam Et — ${CREDIT_PACKAGES.find(p => p.id === selectedPkg)?.price}`}
            size="lg"
            icon={<ShoppingCart size={15} color="#fff" />}
            style={{ flex: 1 }}
          />
        }
      >
        <View style={styles.pkgList}>
          {CREDIT_PACKAGES.map((pkg) => {
            const isSelected = selectedPkg === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPkg(pkg.id)}
                activeOpacity={0.75}
                style={[styles.pkgCard, isSelected && styles.pkgCardSelected]}
              >
                <View style={styles.pkgLeft}>
                  <View style={[styles.pkgRadio, isSelected && styles.pkgRadioSelected]}>
                    {isSelected && <View style={styles.pkgRadioFill} />}
                  </View>
                  <View>
                    <View style={styles.pkgTitleRow}>
                      <Text style={[styles.pkgLabel, isSelected && styles.pkgLabelSelected]}>
                        {pkg.label}
                      </Text>
                      {pkg.badge && (
                        <View style={[styles.pkgBadge, pkg.id === "p10" && styles.pkgBadgeGreen]}>
                          <Text style={[styles.pkgBadgeText, pkg.id === "p10" && { color: Colors.green }]}>{pkg.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pkgSub}>
                      {pkg.credits} belge · {Math.round(pkg.priceNum / pkg.credits)}₺/belge
                    </Text>
                  </View>
                </View>
                <Text style={[styles.pkgPrice, isSelected && styles.pkgPriceSelected]}>
                  {pkg.price}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.pkgNote}>
            <Text style={styles.pkgNoteText}>
              💡 Krediler süresiz geçerlidir, belirli bir kullanım süresi yoktur.
            </Text>
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
    alignItems: "center", justifyContent: "center", marginBottom: 20,
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
    backgroundColor: Colors.background, alignItems: "center", justifyContent: "center",
  },
  featureTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, marginBottom: 3, letterSpacing: -0.2 },
  featureDesc: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  onboardingBtns: { gap: 14 },
  terms: { fontSize: 11, color: Colors.mutedForeground, textAlign: "center", lineHeight: 16 },

  // Profile header
  scroll: { paddingBottom: 40 },
  profileHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.accent },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 17, fontWeight: "600", color: Colors.label, letterSpacing: -0.4 },
  proBadge: { backgroundColor: Colors.purple, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  proBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  email: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  logoutBtn: { padding: 6 },

  // Stats row
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

  // Credit card
  creditCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    padding: 14, ...Shadows.xs,
  },
  creditCardLeft: { flex: 1 },
  creditCardTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  creditCardDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2, lineHeight: 17 },
  creditBuyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  creditBuyBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },

  // Pricing card
  pricingCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    overflow: "hidden", ...Shadows.xs,
  },
  pricingRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 14,
  },
  pricingRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  pricingRowHighlight: { backgroundColor: Colors.accentLight },
  pricingLabel: { fontSize: 14, fontWeight: "500", color: Colors.label, letterSpacing: -0.2 },
  pricingLabelHighlight: { color: Colors.accent, fontWeight: "600" },
  pricingSub: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },
  pricingPrice: { fontSize: 16, fontWeight: "700", color: Colors.label, letterSpacing: -0.3 },
  pricingPriceHighlight: { color: Colors.accent },

  // Menu
  menuCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    overflow: "hidden", ...Shadows.xs,
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 10 },
  menuRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.separator },
  menuIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.label, letterSpacing: -0.2 },
  menuValue: { fontSize: 13, color: Colors.mutedForeground, marginRight: 4 },

  // AI badge
  aiBadgeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.accentLight, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accentMid, padding: 14,
  },
  aiBadgeIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center",
  },
  aiBadgeTitle: { fontSize: 14, fontWeight: "600", color: Colors.accent, letterSpacing: -0.2 },
  aiBadgeDesc: { fontSize: 12, color: Colors.accent, opacity: 0.75, marginTop: 2, lineHeight: 17 },

  footer: { fontSize: 11, color: Colors.mutedForeground, textAlign: "center", marginTop: 28, paddingHorizontal: 24, lineHeight: 16 },

  // Package selector (buy credits sheet)
  pkgList: { gap: 10 },
  pkgCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  pkgCardSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  pkgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pkgRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.separator,
    alignItems: "center", justifyContent: "center",
  },
  pkgRadioSelected: { borderColor: Colors.accent },
  pkgRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  pkgTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  pkgLabel: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  pkgLabelSelected: { color: Colors.accent },
  pkgBadge: { backgroundColor: Colors.accent + "20", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  pkgBadgeGreen: { backgroundColor: Colors.green + "20" },
  pkgBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.accent },
  pkgSub: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  pkgPrice: { fontSize: 18, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  pkgPriceSelected: { color: Colors.accent },
  pkgNote: { backgroundColor: Colors.muted, borderRadius: 10, padding: 12, marginTop: 4 },
  pkgNoteText: { fontSize: 12, color: Colors.mutedForeground, lineHeight: 17 },
});
