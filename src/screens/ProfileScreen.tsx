import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronRight,
  Shield,
  Info,
  LogOut,
  ShoppingCart,
  User,
  Pencil,
  FileText,
  Zap,
  Check,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, UserInfo } from "../services/storage";
import { GradientButton, DialogSheet } from "../components/ui";

export const ProfileScreen: React.FC = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [credits, setCredits] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("p3");
  const [infoOpen, setInfoOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "",
  });
  const [draft, setDraft] = useState<UserInfo>({
    ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "",
  });
  const [savingInfo, setSavingInfo] = useState(false);

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
    const info = await StorageService.getUserInfo();
    setUserInfo(info);
  };

  const handleOpenInfoForm = () => {
    setDraft({ ...userInfo });
    setInfoOpen(true);
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    await StorageService.saveUserInfo(draft);
    setUserInfo(draft);
    setSavingInfo(false);
    setInfoOpen(false);
  };

  const handleBuyCredits = async () => {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === selectedPkg)!;
    const next = await StorageService.addCredits(pkg.credits);
    setCredits(next);
    setBuyOpen(false);
    Alert.alert(
      "Çok Yakında",
      `Uygulama içi satın alma özelliği çok yakında aktif olacak. ${pkg.credits} deneme kredisi hesabınıza eklendi.`,
    );
  };

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.onboarding} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <Text style={{ fontSize: 44 }}>⚖️</Text>
            </View>
            <Text style={styles.heroTitle}>EvrakAI</Text>
            <Text style={styles.heroSub}>
              Yapay zekâ destekli Türkçe belge asistanı.{"\n"}
              Dilekçe, başvuru, taahhütname ve daha fazlası.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featureList}>
            {[
              {
                emoji: "📄",
                title: "Akıllı Belge Oluşturma",
                desc: "Doğal dilde tarif edin, belge saniyeler içinde hazır olsun",
                color: Colors.primary,
              },
              {
                emoji: "🔒",
                title: "Gizliliğiniz Önce",
                desc: "Belgeleriniz yalnızca cihazınızda saklanır",
                color: Colors.green,
              },
              {
                emoji: "⚡",
                title: "Hızlı ve Kolay",
                desc: "Karmaşık formlar yok — sadece yazın, asistan halleder",
                color: Colors.orange,
              },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.color + "14" }]}>
                  <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.onboardingCta}>
            <GradientButton
              onPress={async () => {
                await StorageService.setUserLoggedIn(true);
                setSignedIn(true);
              }}
              title="Ücretsiz Başla"
              size="lg"
              icon={<Zap size={17} color="#fff" strokeWidth={2.5} />}
            />
            <Text style={styles.termsText}>
              Devam ederek Gizlilik Politikamızı kabul etmiş olursunuz.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  const hasUserInfo = !!(userInfo.ad || userInfo.soyad);
  const displayName = [userInfo.ad, userInfo.soyad].filter(Boolean).join(" ") || "EvrakAI Kullanıcısı";
  const initials = ((userInfo.ad?.[0] ?? "") + (userInfo.soyad?.[0] ?? "")).toUpperCase() || "AI";
  const creditOut = credits === 0;
  const creditLow = credits <= 2 && !creditOut;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.profileHeroInner}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>Yapay zekâ ile belge asistanı</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
                  { text: "Vazgeç", style: "cancel" },
                  {
                    text: "Çıkış", style: "destructive",
                    onPress: async () => {
                      await StorageService.setUserLoggedIn(false);
                      setSignedIn(false);
                    },
                  },
                ])
              }
              style={styles.logoutBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LogOut size={17} color={Colors.labelSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDocs}</Text>
              <Text style={styles.statLabel}>Belge</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, creditOut && { color: Colors.red }, creditLow && { color: Colors.orange }]}>
                {credits}
              </Text>
              <Text style={styles.statLabel}>Kredi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>∞</Text>
              <Text style={styles.statLabel}>Süre</Text>
            </View>
          </View>
        </View>

        {/* Kişisel Bilgiler */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Kişisel Bilgilerim</Text>
            <TouchableOpacity onPress={handleOpenInfoForm} activeOpacity={0.7} style={styles.editChip}>
              <Pencil size={12} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.editChipText}>{hasUserInfo ? "Düzenle" : "Ekle"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleOpenInfoForm} activeOpacity={0.8} style={styles.infoCard}>
            {hasUserInfo ? (
              <View style={styles.infoCardFilled}>
                <View style={styles.infoAvatar}>
                  <Text style={styles.infoAvatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoName}>{displayName}</Text>
                  <Text style={styles.infoMeta} numberOfLines={1}>
                    {[userInfo.tckn && `TC: ${userInfo.tckn}`, userInfo.telefon]
                      .filter(Boolean)
                      .join(" · ") || "Bilgiler kaydedildi"}
                  </Text>
                </View>
                <View style={styles.autofillBadge}>
                  <Check size={11} color={Colors.green} strokeWidth={2.5} />
                  <Text style={styles.autofillText}>Aktif</Text>
                </View>
              </View>
            ) : (
              <View style={styles.infoCardEmpty}>
                <View style={styles.infoEmptyIconWrap}>
                  <User size={22} color={Colors.primary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoEmptyTitle}>Bilgilerimi Kaydet</Text>
                  <Text style={styles.infoEmptyDesc}>
                    Ad, TCKN, telefon ekle — belgelerinize otomatik dolsun
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.primary} strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Kredi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Belge Kredisi</Text>
          <View style={[
            styles.creditCard,
            creditOut && { borderColor: Colors.red + "40", backgroundColor: Colors.redLight },
          ]}>
            <View style={[styles.creditIconWrap, { backgroundColor: creditOut ? Colors.red : Colors.primary }]}>
              <Zap size={18} color="#fff" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.creditTitle, creditOut && { color: Colors.red }]}>
                {creditOut ? "Krediniz bitti" : `${credits} belge kredisi`}
              </Text>
              <Text style={styles.creditDesc}>
                {creditOut
                  ? "Belge oluşturmak için kredi satın alın"
                  : "Süresiz geçerli · belge başına 1 kredi"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setBuyOpen(true)} activeOpacity={0.8} style={styles.creditBuyBtn}>
              <ShoppingCart size={14} color="#fff" strokeWidth={2} />
              <Text style={styles.creditBuyText}>Kredi Al</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fiyatlandırma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiyatlandırma</Text>
          <View style={styles.pricingCard}>
            {[
              { label: "1 Belge", price: "₺29", sub: "Tek seferlik", highlight: false },
              { label: "3 Belge Paketi", price: "₺59", sub: "Belge başı ₺20 — %32 ucuz", highlight: true },
              { label: "10 Belge Paketi", price: "₺129", sub: "Belge başı ₺13 — %55 ucuz", highlight: false },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setBuyOpen(true)}
                activeOpacity={0.75}
                style={[
                  styles.pricingRow,
                  i < 2 && styles.pricingRowBorder,
                  item.highlight && styles.pricingRowHighlight,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pricingLabel, item.highlight && styles.pricingLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.pricingSub}>{item.sub}</Text>
                </View>
                <Text style={[styles.pricingPrice, item.highlight && styles.pricingPriceActive]}>
                  {item.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bilgi menüsü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilgi</Text>
          <View style={styles.menuCard}>
            {[
              {
                Icon: Shield,
                label: "Gizlilik & KVKK",
                value: "Veriler cihazda",
                color: Colors.green,
                onPress: () =>
                  Alert.alert(
                    "Gizlilik",
                    "KVKK kapsamında tüm verileriniz yalnızca cihazınızın yerel depolamasında tutulur.",
                  ),
              },
              {
                Icon: FileText,
                label: "Desteklenen Belgeler",
                value: "15+ tür",
                color: Colors.primary,
                onPress: () =>
                  Alert.alert(
                    "Desteklenen Belgeler",
                    "• Dilekçe\n• İstifa Dilekçesi\n• İzin Talebi\n• Kayıt Dondurma\n• Nakil Talebi\n• Not İtirazı\n• Öğrenci Belgesi Talebi\n• Devamsızlık Affı\n• Bilgi Edinme Başvurusu\n• İş Başvuru Yazısı\n• Referans Mektubu\n• Taahhütname\n• Şikayet Dilekçesi\n• Ücret/Yan Hak Talebi\n• SGK Belge Talebi",
                  ),
              },
              {
                Icon: Info,
                label: "Hakkında",
                value: "v2.0.0",
                color: Colors.labelTertiary,
                onPress: () =>
                  Alert.alert(
                    "EvrakAI",
                    "Yapay zekâ destekli Türkçe belge asistanı\nVersiyon 2.0.0",
                  ),
              },
            ].map((item, i) => {
              const Icon = item.Icon;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  activeOpacity={0.72}
                  style={[styles.menuRow, i < 2 && styles.menuRowBorder]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: item.color + "14" }]}>
                    <Icon size={16} color={item.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuValue}>{item.value}</Text>
                  <ChevronRight size={14} color={Colors.labelTertiary} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.footer}>
          EvrakAI hukuki tavsiye vermez. Avukata danışmayı ihmal etmeyin.
        </Text>
      </ScrollView>

      {/* User Info Sheet */}
      <DialogSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Kişisel Bilgilerim"
        subtitle="Belgelerinize otomatik olarak eklenecek"
        footer={
          <GradientButton
            onPress={handleSaveInfo}
            title={savingInfo ? "Kaydediliyor…" : "Kaydet"}
            loading={savingInfo}
            size="lg"
            style={{ flex: 1 }}
          />
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.formList}>
            {([
              { key: "ad", label: "Ad", placeholder: "Ahmet", keyboard: "default" },
              { key: "soyad", label: "Soyad", placeholder: "Yılmaz", keyboard: "default" },
              { key: "tckn", label: "T.C. Kimlik No", placeholder: "12345678901", keyboard: "numeric", maxLength: 11 },
              { key: "telefon", label: "Telefon", placeholder: "0532 000 00 00", keyboard: "phone-pad" },
              { key: "eposta", label: "E-posta", placeholder: "ahmet@mail.com", keyboard: "email-address" },
              { key: "adres", label: "Adres", placeholder: "Mahalle, Cadde, No, İlçe/İl", keyboard: "default", multiline: true },
            ] as const).map((field) => (
              <View key={field.key} style={styles.formField}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  value={draft[field.key]}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [field.key]: v }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.labelTertiary}
                  keyboardType={field.keyboard as any}
                  maxLength={"maxLength" in field ? field.maxLength : undefined}
                  multiline={"multiline" in field && field.multiline}
                  style={[
                    styles.formInput,
                    "multiline" in field && field.multiline && styles.formInputMulti,
                  ]}
                  autoCapitalize={field.keyboard === "default" ? "words" : "none"}
                />
              </View>
            ))}
            <View style={styles.formNote}>
              <Shield size={13} color={Colors.green} strokeWidth={2} />
              <Text style={styles.formNoteText}>
                Bilgileriniz yalnızca cihazınızda saklanır, hiçbir sunucuya gönderilmez.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </DialogSheet>

      {/* Buy Credits Sheet */}
      <DialogSheet
        visible={buyOpen}
        onClose={() => setBuyOpen(false)}
        title="Belge Kredisi Al"
        subtitle="1 kredi = 1 belge oluşturma hakkı"
        footer={
          <GradientButton
            onPress={handleBuyCredits}
            title={`Satın Al — ${CREDIT_PACKAGES.find((p) => p.id === selectedPkg)?.price}`}
            size="lg"
            icon={<ShoppingCart size={15} color="#fff" />}
            style={{ flex: 1 }}
          />
        }
      >
        <View style={styles.pkgList}>
          {CREDIT_PACKAGES.map((pkg) => {
            const sel = selectedPkg === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPkg(pkg.id)}
                activeOpacity={0.75}
                style={[styles.pkgCard, sel && styles.pkgCardSelected]}
              >
                <View style={styles.pkgLeft}>
                  <View style={[styles.pkgRadio, sel && styles.pkgRadioActive]}>
                    {sel && <View style={styles.pkgRadioFill} />}
                  </View>
                  <View>
                    <View style={styles.pkgTitleRow}>
                      <Text style={[styles.pkgLabel, sel && styles.pkgLabelActive]}>{pkg.label}</Text>
                      {pkg.badge && (
                        <View style={[styles.pkgBadge, pkg.id === "p10" && styles.pkgBadgeGreen]}>
                          <Text style={[styles.pkgBadgeText, pkg.id === "p10" && { color: Colors.green }]}>
                            {pkg.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pkgSub}>
                      {pkg.credits} belge · {Math.round(pkg.priceNum / pkg.credits)}₺/belge
                    </Text>
                  </View>
                </View>
                <Text style={[styles.pkgPrice, sel && styles.pkgPriceActive]}>{pkg.price}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={styles.pkgNote}>
            <Text style={styles.pkgNoteText}>
              💡 Krediler süresiz geçerlidir — belirli bir kullanım süresi yoktur.
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
  onboarding: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  heroSection: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  heroIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...Shadows.glow,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.label,
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 16,
    color: Colors.labelSecondary,
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  featureList: { gap: 12, marginBottom: 40 },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    ...Shadows.sm,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.label,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  featureDesc: { fontSize: 13, color: Colors.labelSecondary, lineHeight: 19 },
  onboardingCta: { gap: 14 },
  termsText: {
    fontSize: 12,
    color: Colors.labelTertiary,
    textAlign: "center",
    lineHeight: 17,
  },

  // Profile hero
  scroll: { paddingBottom: 48 },
  profileHero: {
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
    paddingBottom: 0,
    ...Shadows.xs,
  },
  profileHeroInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  profileName: { fontSize: 17, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  profileRole: { fontSize: 13, color: Colors.labelTertiary, marginTop: 2 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginVertical: 12,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: Colors.label, letterSpacing: -0.6 },
  statLabel: { fontSize: 12, color: Colors.labelTertiary, fontWeight: "500" },

  section: { marginTop: 22, paddingHorizontal: 20 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.labelSecondary,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    marginBottom: 10,
  },
  editChipText: { fontSize: 12, fontWeight: "700", color: Colors.primary },

  // Info card
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.sm,
  },
  infoCardFilled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  infoAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoAvatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  infoName: { fontSize: 15, fontWeight: "700", color: Colors.label, letterSpacing: -0.3 },
  infoMeta: { fontSize: 12, color: Colors.labelTertiary, marginTop: 2 },
  autofillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autofillText: { fontSize: 11, fontWeight: "700", color: Colors.green },
  infoCardEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  infoEmptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoEmptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.label, letterSpacing: -0.3 },
  infoEmptyDesc: { fontSize: 13, color: Colors.labelTertiary, marginTop: 3, lineHeight: 18 },

  // Credit card
  creditCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: 16,
    ...Shadows.sm,
  },
  creditIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  creditTitle: { fontSize: 15, fontWeight: "700", color: Colors.label, letterSpacing: -0.3 },
  creditDesc: { fontSize: 12, color: Colors.labelTertiary, marginTop: 3 },
  creditBuyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.glow,
  },
  creditBuyText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Pricing
  pricingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.sm,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pricingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  pricingRowHighlight: { backgroundColor: Colors.accentLight },
  pricingLabel: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  pricingLabelActive: { color: Colors.primary, fontWeight: "700" },
  pricingSub: { fontSize: 12, color: Colors.labelTertiary, marginTop: 2 },
  pricingPrice: { fontSize: 17, fontWeight: "800", color: Colors.label, letterSpacing: -0.4 },
  pricingPriceActive: { color: Colors.primary },

  // Menu
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  menuValue: { fontSize: 13, color: Colors.labelTertiary },

  footer: {
    fontSize: 12,
    color: Colors.labelTertiary,
    textAlign: "center",
    marginTop: 24,
    marginHorizontal: 24,
    lineHeight: 18,
  },

  // Form
  formList: { gap: 14 },
  formField: { gap: 6 },
  formLabel: { fontSize: 13, fontWeight: "600", color: Colors.labelSecondary, letterSpacing: -0.1 },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.label,
    letterSpacing: -0.2,
  },
  formInputMulti: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  formNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.greenLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  formNoteText: { flex: 1, fontSize: 13, color: Colors.green, lineHeight: 18, fontWeight: "500" },

  // Credit packages
  pkgList: { gap: 10 },
  pkgCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  pkgCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  pkgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pkgRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.separatorOpaque,
    alignItems: "center",
    justifyContent: "center",
  },
  pkgRadioActive: { borderColor: Colors.primary },
  pkgRadioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  pkgTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  pkgLabel: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.3 },
  pkgLabelActive: { color: Colors.primary },
  pkgSub: { fontSize: 12, color: Colors.labelTertiary, marginTop: 2 },
  pkgPrice: { fontSize: 18, fontWeight: "800", color: Colors.label, letterSpacing: -0.5 },
  pkgPriceActive: { color: Colors.primary },
  pkgBadge: {
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pkgBadgeGreen: { backgroundColor: Colors.green + "15" },
  pkgBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  pkgNote: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  pkgNoteText: { fontSize: 13, color: Colors.labelSecondary, lineHeight: 18 },
});
