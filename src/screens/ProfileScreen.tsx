import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Alert, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronRight, Shield, Info, LogOut,
  ShoppingCart, FileText, Zap, Check, Sparkles,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, UserInfo } from "../services/storage";
import { GradientButton, DialogSheet } from "../components/ui";

const PACKAGES = [
  { id: "p1",  credits: 1,  price: "₺29",  priceNum: 29,  label: "1 Belge",  badge: null },
  { id: "p3",  credits: 3,  price: "₺59",  priceNum: 59,  label: "3 Belge",  badge: "Popüler" },
  { id: "p10", credits: 10, price: "₺129", priceNum: 129, label: "10 Belge", badge: "En İyi" },
];

export const ProfileScreen: React.FC = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [credits, setCredits] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo>({ ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "" });
  const [draft, setDraft]       = useState<UserInfo>({ ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "" });
  const [buyOpen, setBuyOpen]   = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("p3");
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    setSignedIn(await StorageService.getUserLoggedIn());
    setCredits(await StorageService.getCredits());
    const docs = await StorageService.getDocuments();
    setTotalDocs(docs.length);
    const info = await StorageService.getUserInfo();
    setUserInfo(info);
  };

  const openInfoForm = () => { setDraft({ ...userInfo }); setInfoOpen(true); };

  const saveInfo = async () => {
    setSaving(true);
    await StorageService.saveUserInfo(draft);
    setUserInfo(draft);
    setSaving(false);
    setInfoOpen(false);
  };

  const buyCredits = async () => {
    const pkg = PACKAGES.find(p => p.id === selectedPkg)!;
    const next = await StorageService.addCredits(pkg.credits);
    setCredits(next);
    setBuyOpen(false);
    Alert.alert("Çok Yakında", `Uygulama içi satın alma yakında aktif. ${pkg.credits} kredi hesabınıza deneme olarak eklendi.`);
  };

  const signOut = () =>
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış", style: "destructive",
        onPress: async () => { await StorageService.setUserLoggedIn(false); setSignedIn(false); },
      },
    ]);

  const hasInfo     = !!(userInfo.ad || userInfo.soyad);
  const displayName = [userInfo.ad, userInfo.soyad].filter(Boolean).join(" ") || "Kullanıcı";
  const initials    = ((userInfo.ad?.[0] ?? "") + (userInfo.soyad?.[0] ?? "")).toUpperCase() || "AI";
  const creditOut   = credits === 0;
  const creditLow   = credits > 0 && credits <= 2;

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  if (!signedIn) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={s.onboardContent} showsVerticalScrollIndicator={false}>

          <View style={s.hero}>
            <View style={s.heroIcon}>
              <Sparkles size={36} color="#fff" strokeWidth={1.8} />
            </View>
            <Text style={s.heroTitle}>EvrakAI</Text>
            <Text style={s.heroSubtitle}>
              Yapay zekâ ile Türkçe hukuki belgeler.{"\n"}Saniyeler içinde hazır.
            </Text>
          </View>

          <View style={s.featureCard}>
            {[
              { emoji: "📄", title: "Akıllı Belge Oluşturma", body: "Doğal dilde anlatın, belge anında hazır olsun" },
              { emoji: "🔒", title: "Gizlilik Önce",           body: "Tüm veriler yalnızca cihazınızda saklanır" },
              { emoji: "⚡", title: "Hızlı & Kolay",           body: "Form yok — sadece konuşun, asistan halleder" },
            ].map((f, i, arr) => (
              <View key={i} style={[s.featureRow, i < arr.length - 1 && s.featureRowBorder]}>
                <View style={s.featureEmoji}><Text style={{ fontSize: 18 }}>{f.emoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <GradientButton
            onPress={async () => { await StorageService.setUserLoggedIn(true); setSignedIn(true); }}
            title="Ücretsiz Başla"
            size="lg"
            style={{ marginTop: 8 }}
            icon={<Zap size={16} color="#fff" strokeWidth={2.5} />}
          />
          <Text style={s.termsNote}>Devam ederek Gizlilik Politikamızı kabul edersiniz.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: 52 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.pageTitle}>Profil</Text>
          <TouchableOpacity onPress={signOut} style={s.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <LogOut size={15} color={Colors.label3} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={s.section}>
          <TouchableOpacity onPress={openInfoForm} activeOpacity={0.78} style={s.userCard}>
            <View style={s.avatar}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{displayName}</Text>
              <Text style={s.userMeta}>
                {hasInfo
                  ? [userInfo.tckn && `TC · ${userInfo.tckn}`, userInfo.telefon].filter(Boolean).join("   ·   ") || "Bilgiler kaydedildi"
                  : "Kişisel bilgilerini ekle →"}
              </Text>
            </View>
            {hasInfo
              ? (
                <View style={s.activeBadge}>
                  <Check size={10} color={Colors.green} strokeWidth={3} />
                  <Text style={s.activeText}>Aktif</Text>
                </View>
              )
              : <ChevronRight size={15} color={Colors.label3} strokeWidth={2} />
            }
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[s.section, { marginTop: 0 }]}>
          <View style={s.statsRow}>
            {[
              { value: totalDocs.toString(), label: "Belge",  alert: false },
              { value: credits.toString(),   label: "Kredi",  alert: creditOut || creditLow },
              { value: "∞",                  label: "Süre",   alert: false },
            ].map((stat, i, arr) => (
              <React.Fragment key={i}>
                <View style={s.statItem}>
                  <Text style={[
                    s.statValue,
                    stat.alert && { color: creditOut ? Colors.red : Colors.orange },
                  ]}>
                    {stat.value}
                  </Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Kredi */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>KREDİ</Text>
          <View style={s.groupCard}>
            <View style={s.listRow}>
              <View style={[s.rowIconWrap, { backgroundColor: creditOut ? Colors.redLight : Colors.accentLight }]}>
                <Zap size={15} color={creditOut ? Colors.red : Colors.accent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>
                  {creditOut ? "Kredi bitti" : `${credits} belge kredisi`}
                </Text>
                <Text style={s.rowSub}>Belge başına 1 kredi · Süresiz</Text>
              </View>
              <TouchableOpacity onPress={() => setBuyOpen(true)} style={s.buyBtn} activeOpacity={0.82}>
                <ShoppingCart size={12} color="#fff" strokeWidth={2.2} />
                <Text style={s.buyBtnText}>Satın Al</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bilgi */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>BİLGİ</Text>
          <View style={s.groupCard}>
            {[
              {
                icon: Shield, iconBg: Colors.successLight, iconColor: Colors.green,
                title: "Gizlilik & KVKK", sub: "Veriler cihazda",
                onPress: () => Alert.alert("Gizlilik", "KVKK kapsamında tüm verileriniz yalnızca cihazınızın yerel depolamasında tutulur."),
              },
              {
                icon: FileText, iconBg: Colors.accentLight, iconColor: Colors.accent,
                title: "Desteklenen Belgeler", sub: "15+ tür",
                onPress: () => Alert.alert("Belgeler", "Dilekçe, İstifa, İzin, Kayıt Dondurma, Nakil, Not İtirazı, Devamsızlık Affı, Bilgi Edinme, İş Başvurusu, Referans Mektubu, Taahhütname, Şikayet, Ücret Talebi, SGK Talebi ve daha fazlası."),
              },
              {
                icon: Info, iconBg: Colors.fill, iconColor: Colors.label3,
                title: "Hakkında", sub: "v2.0.0",
                onPress: () => Alert.alert("EvrakAI", "Yapay zekâ destekli Türkçe belge asistanı\nVersiyon 2.0.0"),
              },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={i} onPress={item.onPress} activeOpacity={0.72}
                  style={[s.listRow, i < arr.length - 1 && s.listRowBorder]}
                >
                  <View style={[s.rowIconWrap, { backgroundColor: item.iconBg }]}>
                    <Icon size={15} color={item.iconColor} strokeWidth={1.8} />
                  </View>
                  <Text style={s.rowTitle}>{item.title}</Text>
                  <Text style={s.rowSubRight}>{item.sub}</Text>
                  <ChevronRight size={14} color={Colors.label3} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={s.footNote}>
          EvrakAI hukuki tavsiye vermez.{"\n"}Önemli işlemler için bir avukata danışın.
        </Text>
      </ScrollView>

      {/* Personal Info Sheet */}
      <DialogSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Kişisel Bilgiler"
        subtitle="Belgelerinize otomatik eklenir"
        footer={
          <GradientButton
            onPress={saveInfo}
            title={saving ? "Kaydediliyor…" : "Kaydet"}
            loading={saving}
            size="lg"
            style={{ flex: 1 }}
          />
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ gap: 14 }}>
            {([
              { key: "ad",      label: "Ad",             placeholder: "Ahmet",           kb: "default",      cap: "words" },
              { key: "soyad",   label: "Soyad",          placeholder: "Yılmaz",          kb: "default",      cap: "words" },
              { key: "tckn",    label: "T.C. Kimlik No", placeholder: "12345678901",     kb: "numeric",      cap: "none", max: 11 },
              { key: "telefon", label: "Telefon",        placeholder: "0532 000 00 00",  kb: "phone-pad",    cap: "none" },
              { key: "eposta",  label: "E-posta",        placeholder: "isim@mail.com",   kb: "email-address",cap: "none" },
              { key: "adres",   label: "Adres",          placeholder: "Mahalle, Cadde, No, İlçe/İl", kb: "default", cap: "sentences", multi: true },
            ] as const).map(f => (
              <View key={f.key} style={{ gap: 6 }}>
                <Text style={s.formLabel}>{f.label}</Text>
                <TextInput
                  value={draft[f.key]}
                  onChangeText={v => setDraft(d => ({ ...d, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.label3}
                  keyboardType={f.kb as any}
                  autoCapitalize={f.cap as any}
                  maxLength={"max" in f ? f.max : undefined}
                  multiline={"multi" in f && f.multi}
                  style={[s.formInput, "multi" in f && f.multi && s.formInputMulti]}
                />
              </View>
            ))}
            <View style={s.privacyNote}>
              <Shield size={12} color={Colors.green} strokeWidth={2} />
              <Text style={s.privacyText}>
                Bilgiler yalnızca cihazınızda saklanır, hiçbir sunucuya gönderilmez.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </DialogSheet>

      {/* Buy Credits Sheet */}
      <DialogSheet
        visible={buyOpen}
        onClose={() => setBuyOpen(false)}
        title="Kredi Al"
        subtitle="1 kredi = 1 belge · Süresiz geçerli"
        footer={
          <GradientButton
            onPress={buyCredits}
            title={`Satın Al — ${PACKAGES.find(p => p.id === selectedPkg)?.price}`}
            size="lg"
            icon={<ShoppingCart size={14} color="#fff" />}
            style={{ flex: 1 }}
          />
        }
      >
        <View style={{ gap: 10 }}>
          {PACKAGES.map(pkg => {
            const sel = selectedPkg === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPkg(pkg.id)}
                activeOpacity={0.78}
                style={[s.pkgRow, sel && s.pkgRowActive]}
              >
                <View style={[s.pkgRadio, sel && s.pkgRadioActive]}>
                  {sel && <View style={s.pkgRadioFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[s.pkgTitle, sel && { color: Colors.accent }]}>{pkg.label}</Text>
                    {pkg.badge && (
                      <View style={[s.pkgBadge, sel && { backgroundColor: Colors.accentMid }]}>
                        <Text style={s.pkgBadgeText}>{pkg.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.pkgPerDoc}>{Math.round(pkg.priceNum / pkg.credits)}₺/belge</Text>
                </View>
                <Text style={[s.pkgPrice, sel && { color: Colors.accent }]}>{pkg.price}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={s.pkgNote}>
            <Text style={s.pkgNoteText}>
              Krediler süresiz geçerlidir. İnternet bağlantısı gerektirmez.
            </Text>
          </View>
        </View>
      </DialogSheet>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Onboarding
  onboardContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 52 },
  hero: { alignItems: "center", paddingTop: 60, paddingBottom: 48 },
  heroIcon: {
    width: 92, height: 92, borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24, ...Shadows.glow,
  },
  heroTitle: {
    fontSize: 32, fontWeight: "700", color: Colors.label,
    letterSpacing: -0.8, marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16, color: Colors.label2,
    textAlign: "center", lineHeight: 25, letterSpacing: -0.2,
  },
  featureCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
    marginBottom: 24,
    ...Shadows.card,
  },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  featureEmoji: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
  },
  featureTitle: { fontSize: 15, fontWeight: "600", color: Colors.label, marginBottom: 2, letterSpacing: -0.2 },
  featureBody:  { fontSize: 13, color: Colors.label2, lineHeight: 19 },
  termsNote:    { fontSize: 12, color: Colors.label3, textAlign: "center", marginTop: 16, lineHeight: 18 },

  // Profile
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: Colors.card,
  },
  pageTitle: { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.6 },
  headerBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
  },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: Colors.label3,
    letterSpacing: 0.8, marginBottom: 10,
  },

  // User card
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 20, padding: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    ...Shadows.card,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    ...Shadows.glow,
  },
  avatarInitials: { fontSize: 18, fontWeight: "700", color: "#fff" },
  userName:       { fontSize: 16, fontWeight: "600", color: Colors.label, letterSpacing: -0.3 },
  userMeta:       { fontSize: 12, color: Colors.label3, marginTop: 3 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
  },
  activeText: { fontSize: 11, fontWeight: "600", color: Colors.green },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.card,
  },
  statItem:    { flex: 1, alignItems: "center", paddingVertical: 20, gap: 5 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginVertical: 16 },
  statValue:   { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.8 },
  statLabel:   { fontSize: 12, color: Colors.label3 },

  // Group card
  groupCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    overflow: "hidden",
    ...Shadows.card,
  },
  listRow: {
    flexDirection: "row", alignItems: "center", gap: 13,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rowTitle:    { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.label, letterSpacing: -0.2 },
  rowSub:      { fontSize: 12, color: Colors.label3 },
  rowSubRight: { fontSize: 12, color: Colors.label3, marginRight: 4 },

  buyBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12,
    ...Shadows.glow,
  },
  buyBtnText: { fontSize: 12, fontWeight: "700", color: "#fff", letterSpacing: -0.1 },

  footNote: {
    fontSize: 12, color: Colors.label3, textAlign: "center",
    marginTop: 32, marginHorizontal: 36, lineHeight: 19,
  },

  // Form
  formLabel: { fontSize: 13, fontWeight: "500", color: Colors.label2 },
  formInput: {
    backgroundColor: Colors.bg,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.separator,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.label, letterSpacing: -0.1,
  },
  formInputMulti: { height: 82, textAlignVertical: "top", paddingTop: 12 },
  privacyNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 9,
    backgroundColor: Colors.successLight,
    borderRadius: 14, padding: 13,
  },
  privacyText: { flex: 1, fontSize: 12, color: Colors.green, lineHeight: 18 },

  // Packages
  pkgRow: {
    flexDirection: "row", alignItems: "center", gap: 13,
    padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.separator,
    backgroundColor: Colors.bg,
  },
  pkgRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  pkgRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.separatorOpaque,
    alignItems: "center", justifyContent: "center",
  },
  pkgRadioActive: { borderColor: Colors.accent },
  pkgRadioFill:   { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.accent },
  pkgTitle:  { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  pkgPerDoc: { fontSize: 12, color: Colors.label3, marginTop: 2 },
  pkgPrice:  { fontSize: 20, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  pkgBadge:  { backgroundColor: Colors.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pkgBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.accent, letterSpacing: 0.1 },
  pkgNote:   { backgroundColor: Colors.fill, borderRadius: 14, padding: 14 },
  pkgNoteText: { fontSize: 13, color: Colors.label2, lineHeight: 19 },
});
