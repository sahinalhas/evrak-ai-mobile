import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
  LogIn,
  Sliders,
  LogOut,
  Check,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { Colors, Shadows, Typography } from "../components/Theme";
import { StorageService } from "../services/storage";
import { GradientButton } from "../components/ui";

const PACKS = [
  { credits: 1, price: "29 TL", popular: false },
  { credits: 3, price: "79 TL", popular: true },
  { credits: 10, price: "129 TL", popular: false },
];

export const ProfileScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const [signedIn, setSignedIn] = useState(false);
  const [quota, setQuota] = useState(4);
  const [totalDocs, setTotalDocs] = useState(0);

  // Settings states
  const [activeProvider, setActiveProvider] = useState<"lovable" | "gemini" | "mock">("mock");
  const [geminiKey, setGeminiKey] = useState("");
  const [lovableKey, setLovableKey] = useState("");
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Load states on mount & screen focus
  useEffect(() => {
    if (isFocused) {
      loadProfileData();
    }
  }, [isFocused]);

  const loadProfileData = async () => {
    const loginStatus = await StorageService.getUserLoggedIn();
    setSignedIn(loginStatus);

    const activeQuota = await StorageService.getQuota();
    setQuota(activeQuota);

    const docs = await StorageService.getDocuments();
    setTotalDocs(docs.length);

    const keys = await StorageService.getApiKeys();
    setActiveProvider(keys.provider);
    setGeminiKey(keys.geminiKey);
    setLovableKey(keys.lovableKey);
  };

  const handleLogin = async () => {
    setSignedIn(true);
    await StorageService.setUserLoggedIn(true);
  };

  const handleLogout = async () => {
    setSignedIn(false);
    await StorageService.setUserLoggedIn(false);
  };

  const buyPack = async (credits: number, price: string) => {
    const nextQuota = quota + credits;
    setQuota(nextQuota);
    await StorageService.setQuota(nextQuota);
    Alert.alert(
      "Ödeme Başarılı",
      `${credits} Belge Kredisi hesabınıza tanımlandı. Güvenle kullanabilirsiniz. (Mock işlem tutarı: ${price})`
    );
  };

  const saveSettings = async () => {
    await StorageService.saveApiKeys({
      provider: activeProvider,
      geminiKey,
      lovableKey,
    });
    Alert.alert("Başarılı", "Yapay zekâ API ayarlarınız başarıyla kaydedildi.");
    setSettingsExpanded(false);
  };

  // 1. Onboarding Screen
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
          <View style={styles.loginCard}>
            <LinearGradient
              colors={Colors.gradientPrimary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginIconContainer}
            >
              <LogIn size={36} color={Colors.primaryForeground} />
            </LinearGradient>
            <Text style={styles.loginTitle}>Hoş geldiniz</Text>
            <Text style={styles.loginSubtitle}>
              Belgelerinizi güvenle bulutta saklamak ve tüm cihazlarınızdan erişmek için giriş yapın.
            </Text>
          </View>

          <View style={styles.loginButtons}>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} style={[styles.loginBtn, styles.btnBlack]}>
              <Text style={styles.loginBtnTextWhite}> Apple ile Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8} style={[styles.loginBtn, styles.btnBordered]}>
              <Text style={styles.loginBtnTextBlack}>G  Google ile Giriş Yap</Text>
            </TouchableOpacity>

            <GradientButton
              onPress={handleLogin}
              title="E-posta ile Devam Et"
              style={styles.loginPrimaryBtn}
            />
          </View>

          <Text style={styles.kvkkWarning}>
            Devam ederek KVKK kapsamında açık rıza beyanını, Gizlilik Politikasını ve Kullanım Koşullarını kabul etmiş olursunuz.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Active Logged In Screen
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Card Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={Colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>AY</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Ahmet Yılmaz</Text>
            <Text style={styles.profileEmail}>ahmet@evrakai.com</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} color={Colors.mutedForeground} />
            <Text style={styles.logoutText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        {/* Credit Quota Card */}
        <View style={styles.creditCardSection}>
          <LinearGradient
            colors={Colors.gradientHero as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.creditCard}
          >
            <View style={styles.creditCardTop}>
              <View>
                <Text style={styles.creditLabel}>Belge Krediniz</Text>
                <Text style={styles.creditValue}>{quota}</Text>
              </View>
              <Zap size={32} color={Colors.primaryForeground} style={styles.creditIcon} />
            </View>
            <Text style={styles.creditCardBottom}>
              Her evrak oluşturma işlemi 1 kredi harcar.
            </Text>
          </LinearGradient>
        </View>

        {/* Credit Packs */}
        <View style={styles.packsSection}>
          <Text style={styles.sectionTitle}>Kredi Satın Al</Text>
          <View style={styles.packsGrid}>
            {PACKS.map((p) => (
              <TouchableOpacity
                key={p.credits}
                onPress={() => buyPack(p.credits, p.price)}
                activeOpacity={0.8}
                style={[styles.packCard, p.popular && styles.packCardPopular]}
              >
                {p.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPÜLER</Text>
                  </View>
                )}
                <Text style={[styles.packCredits, p.popular && styles.packCreditsActive]}>
                  {p.credits}
                </Text>
                <Text style={[styles.packLabel, p.popular && styles.packLabelActive]}>belge</Text>
                <Text style={[styles.packPrice, p.popular && styles.packPriceActive]}>
                  {p.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced API Config Settings panel */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            onPress={() => setSettingsExpanded(!settingsExpanded)}
            activeOpacity={0.8}
            style={styles.settingsDropdownHeader}
          >
            <View style={styles.dropdownTitleGroup}>
              <Sliders size={18} color={Colors.primary} />
              <Text style={styles.sectionTitleNoMargin}>Gelişmiş Yapay Zekâ Ayarları</Text>
            </View>
            <ChevronRight
              size={16}
              color={Colors.mutedForeground}
              style={{ transform: [{ rotate: settingsExpanded ? "90deg" : "0deg" }] }}
            />
          </TouchableOpacity>

          {settingsExpanded && (
            <View style={styles.dropdownContent}>
              <Text style={styles.settingsLabel}>Yapay Zekâ Sağlayıcısı Seçin:</Text>
              
              <TouchableOpacity
                onPress={() => setActiveProvider("mock")}
                style={styles.providerRow}
              >
                <View style={[styles.radio, activeProvider === "mock" && styles.radioActive]} />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>Çevrimdışı Akıllı Motor (Mock)</Text>
                  <Text style={styles.providerDesc}>Hızlı test için yerel şablon hazırlayıcı.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveProvider("gemini")}
                style={styles.providerRow}
              >
                <View style={[styles.radio, activeProvider === "gemini" && styles.radioActive]} />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>Google Gemini API (Canlı)</Text>
                  <Text style={styles.providerDesc}>Kendi Gemini API Key'iniz ile doğrudan bağlanın.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveProvider("lovable")}
                style={styles.providerRow}
              >
                <View style={[styles.radio, activeProvider === "lovable" && styles.radioActive]} />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>Lovable AI Gateway (Canlı)</Text>
                  <Text style={styles.providerDesc}>Lovable proxy ağ geçidini kullanın.</Text>
                </View>
              </TouchableOpacity>

              {activeProvider === "gemini" && (
                <View style={styles.apiKeyGroup}>
                  <Text style={styles.apiKeyLabel}>Gemini API Key Girin:</Text>
                  <TextInput
                    value={geminiKey}
                    onChangeText={setGeminiKey}
                    placeholder="AIzaSy..."
                    secureTextEntry
                    style={styles.keyInput}
                  />
                </View>
              )}

              {activeProvider === "lovable" && (
                <View style={styles.apiKeyGroup}>
                  <Text style={styles.apiKeyLabel}>Lovable API Key Girin:</Text>
                  <TextInput
                    value={lovableKey}
                    onChangeText={setLovableKey}
                    placeholder="lovable_key..."
                    secureTextEntry
                    style={styles.keyInput}
                  />
                </View>
              )}

              <GradientButton
                onPress={saveSettings}
                title="Ayarları Kaydet"
                style={styles.saveSettingsBtn}
              />
            </View>
          )}
        </View>

        {/* Statistics section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Kullanım İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <FileText size={16} color={Colors.mutedForeground} />
                <Text style={styles.statLabel}>Toplam Belge</Text>
              </View>
              <Text style={styles.statValue}>{totalDocs}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <TrendingUp size={16} color={Colors.mutedForeground} />
                <Text style={styles.statLabel}>Bu Ay</Text>
              </View>
              <Text style={styles.statValue}>{totalDocs > 0 ? 3 : 0}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Menu List Links */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            onPress={() => Alert.alert("Kişisel Bilgiler", "Ad: Ahmet Yılmaz\nAdres: Çankaya/Ankara\nTCKN: [GİZLENDİ]")}
            style={styles.menuRow}
          >
            <View style={styles.menuIconContainer}>
              <Shield size={16} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Kişisel Bilgiler</Text>
              <Text style={styles.menuDesc}>Ad, soyad, adres ve TCKN taslakları</Text>
            </View>
            <ChevronRight size={14} color={Colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Gizlilik & KVKK", "KVKK kapsamında tüm verileriniz yalnızca cihazınızın yerel hafızasında saklanır. Sunucularımıza hiçbir belge içeriği aktarılmaz.")}
            style={styles.menuRow}
          >
            <View style={styles.menuIconContainer}>
              <Shield size={16} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Gizlilik & KVKK</Text>
              <Text style={styles.menuDesc}>Veri kullanımı ve yerel güvenlik şartları</Text>
            </View>
            <ChevronRight size={14} color={Colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>EvrakAI Mobile v1.0.0</Text>
          <Text style={styles.versionSubtext}>Yapay Zekâ ile evrak oluşturmak artık çok kolay.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loginCard: {
    alignItems: "center",
    marginBottom: 48,
  },
  loginIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...Shadows.glow,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
  },
  loginSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  loginButtons: {
    gap: 12,
  },
  loginBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  btnBlack: {
    backgroundColor: Colors.foreground,
  },
  btnBordered: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loginBtnTextWhite: {
    color: Colors.card,
    fontSize: 13,
    fontWeight: "600",
  },
  loginBtnTextBlack: {
    color: Colors.foreground,
    fontSize: 13,
    fontWeight: "600",
  },
  loginPrimaryBtn: {
    height: 48,
  },
  kvkkWarning: {
    fontSize: 10,
    color: Colors.mutedForeground,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 14,
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  avatarText: {
    color: Colors.primaryForeground,
    fontSize: 18,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.foreground,
  },
  profileEmail: {
    fontSize: 11,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.mutedForeground,
  },
  creditCardSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  creditCard: {
    borderRadius: 24,
    padding: 20,
    ...Shadows.lg,
  },
  creditCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditLabel: {
    fontSize: 11,
    color: Colors.primaryForeground,
    opacity: 0.8,
  },
  creditValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primaryForeground,
    marginTop: 4,
  },
  creditIcon: {
    opacity: 0.9,
  },
  creditCardBottom: {
    fontSize: 10,
    color: Colors.primaryForeground,
    opacity: 0.8,
    marginTop: 12,
  },
  packsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.foreground,
    marginBottom: 10,
  },
  sectionTitleNoMargin: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.foreground,
  },
  packsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  packCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
    ...Shadows.sm,
  },
  packCardPopular: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 7,
    fontWeight: "700",
    color: Colors.warningForeground,
  },
  packCredits: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.foreground,
  },
  packCreditsActive: {
    color: Colors.primaryForeground,
  },
  packLabel: {
    fontSize: 10,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  packLabelActive: {
    color: Colors.primaryForeground,
    opacity: 0.8,
  },
  packPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.foreground,
    marginTop: 8,
  },
  packPriceActive: {
    color: Colors.primaryForeground,
  },
  settingsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: "hidden",
    ...Shadows.sm,
  },
  settingsDropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  dropdownTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  settingsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.mutedForeground,
    marginBottom: 8,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.mutedForeground,
    marginRight: 12,
  },
  radioActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.foreground,
  },
  providerDesc: {
    fontSize: 9,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  apiKeyGroup: {
    marginTop: 12,
  },
  apiKeyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.foreground,
    marginBottom: 6,
  },
  keyInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: Colors.foreground,
  },
  saveSettingsBtn: {
    marginTop: 14,
    height: 40,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    ...Shadows.sm,
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.mutedForeground,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
    marginTop: 6,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    ...Shadows.sm,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.foreground,
  },
  menuDesc: {
    fontSize: 9,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  versionFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  versionText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.mutedForeground,
  },
  versionSubtext: {
    fontSize: 8,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
});
