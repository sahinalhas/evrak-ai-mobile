import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Send, Copy, Share2, RotateCcw, Printer, X, ChevronRight } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { GradientButton, PulsingDots, DialogSheet } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { AIService } from "../services/ai";
import { StorageService } from "../services/storage";
import { printDocument } from "../utils/printDocument";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDocument?: boolean;
};

// ─── Template preview data ───────────────────────────────────────────────────
const TEMPLATE_INFO: Record<string, {
  label: string;
  needed: string[];
  sample: string;
}> = {
  "Dilekçe": {
    label: "Genel Dilekçe",
    needed: ["Kurumun adı", "Talebiniz veya konunuz", "Adınız, TC kimlik no"],
    sample: "# DİLEKÇE\n\n**…………………… Müdürlüğü'ne,**\n\nYukarıda belirtilen konuda tarafınıza başvurma ihtiyacı duyulmuş olup…\n\n**Gereğini arz ederim.**",
  },
  "İzin Talebi": {
    label: "İzin Talebi",
    needed: ["Şirket / kurum adı", "İzin başlangıç ve bitiş tarihi", "İzin türü (yıllık, mazeret vb.)", "Adınız ve unvanınız"],
    sample: "# YILLIK İZİN TALEBİ\n\n**İzin Tarihi:** 01.07.2026 — 05.07.2026 (5 İş Günü)\n**Personel:** Ad Soyad · Yazılım Geliştirici\n\nOnayınıza sunarım.",
  },
  "İstifa": {
    label: "İstifa Dilekçesi",
    needed: ["Şirket adı", "Göreviniz ve başlangıç tarihiniz", "Son çalışma günü (isteğe bağlı)", "Adınız"],
    sample: "# İSTİFA DİLEKÇESİ\n\n**Yönetim Kurulu Başkanlığı'na,**\n\nBünyenizde Yazılım Geliştirici olarak yürütmekte olduğum görevimden istifa etmek istediğimi bildiririm.\n\n**Gereğini arz ederim.**",
  },
  "İş Başvurusu": {
    label: "İş Başvuru Yazısı",
    needed: ["Şirket ve pozisyon adı", "Deneyim yılınız", "Öne çıkarmak istediğiniz bir beceri", "Adınız ve iletişim bilgisi"],
    sample: "# İŞ BAŞVURU YAZISI\n\n**…………… İnsan Kaynakları Departmanı'na,**\n\n…………… pozisyonuna başvurmak istediğimi saygıyla bildiririm. 5 yıllık sektör deneyimimle…",
  },
  "Şikayet": {
    label: "Şikayet Dilekçesi",
    needed: ["Şikayetinizin konusu", "Kurumun veya kişinin adı", "Yaşanan olay ve tarihi", "Talebiniz (özür, iade, işlem vb.)"],
    sample: "# ŞİKAYET DİLEKÇESİ\n\n**…………… Müdürlüğü'ne,**\n\n…………… tarihinde yaşanan olay nedeniyle şikayetçi olduğumu bildiriyorum. Konunun incelenerek gereğinin yapılmasını…",
  },
  "Taahhütname": {
    label: "Taahhütname",
    needed: ["Taahhüt konusu (davranışsal)", "Karşı taraf veya kurum", "Taahhüt süresi (varsa)", "Adınız ve TC kimlik no"],
    sample: "# TAAHHÜTNAME\n\nBen, aşağıda imzası bulunan …………… bundan böyle …………… konusunda üzerime düşen yükümlülükleri yerine getireceğimi taahhüt ederim.",
  },
  "Referans Mektubu": {
    label: "Referans Mektubu",
    needed: ["Referans verilen kişinin adı ve görevi", "Birlikte çalışma süresi", "Öne çıkan 2-3 özellik", "Referans verenin adı ve unvanı"],
    sample: "# REFERANS MEKTUBU\n\n…………… ile …………… süre boyunca birlikte çalışma fırsatı buldum. Kendisi, …………… konusundaki yetkinliği ve çalışma disipliniyle dikkat çekici bir profesyoneldir.",
  },
  "Kayıt Dondurma": {
    label: "Kayıt Dondurma",
    needed: ["Üniversite / okul ve bölüm adı", "Öğrenci numarası", "Dondurma gerekçesi (sağlık, maddi vb.)", "Dondurulmak istenen dönem"],
    sample: "# KAYIT DONDURMA TALEBİ\n\n**Fakülte Dekanlığı'na,**\n\n…………… Bölümü öğrencisi olarak, …………… gerekçesiyle 2026-2027 Güz dönemi için kaydımın dondurulmasını talep ediyorum.",
  },
  "Nakil Talebi": {
    label: "Nakil Talebi",
    needed: ["Mevcut okul / bölüm", "Nakil olmak istediğiniz yer", "Nakil gerekçesi", "Adınız ve öğrenci numarası"],
    sample: "# NAKİL TALEBİ\n\n**Öğrenci İşleri Daire Başkanlığı'na,**\n\n…………… bölümünden …………… bölümüne nakil olmak istediğimi arz ederim. Gerekçem: ……………",
  },
  "Not İtirazı": {
    label: "Not / Sınav İtirazı",
    needed: ["Ders ve öğretim görevlisi adı", "Sınav tarihi ve türü", "İtiraz gerekçeniz", "Öğrenci numarası"],
    sample: "# SINAV SONUCU İTİRAZ DİLEKÇESİ\n\n**Öğretim Görevlisi'ne,**\n\n…………… dersi …………… sınavına ait notuma itiraz etmek istiyorum. Değerlendirme kriterlerine göre…",
  },
  "Bilgi Edinme": {
    label: "Bilgi Edinme Başvurusu",
    needed: ["Başvurulacak kurum", "Talep ettiğiniz bilgi/belge", "Bilgiyi neden istediğiniz", "Adınız ve TC kimlik no"],
    sample: "# BİLGİ EDİNME BAŞVURUSU\n*(4982 Sayılı Bilgi Edinme Hakkı Kanunu kapsamında)*\n\n**…………… Müdürlüğü'ne,**\n\n…………… konusunda bilgi edinmek istiyorum.",
  },
};

const TEMPLATES = Object.keys(TEMPLATE_INFO);

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Merhaba! Hangi belgeyi oluşturmak istediğinizi anlatın — dilekçe, başvuru, taahhütname veya istediğiniz her şey.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{ content: string } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    StorageService.getCredits().then(setCredits);
    StorageService.getUserInfo().then(info => setUserInfo(info));
  }, []));

  const onFocus = () => {
    setInputFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setInputFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const animatedBorder = borderAnim.interpolate({
    inputRange: [0, 1], outputRange: [Colors.separator, Colors.accent],
  });

  const send = async (text?: string) => {
    const raw = (text ?? input).trim();
    if (!raw || loading) return;
    if (credits <= 0) {
      Alert.alert("Kredi Yok", "Belge oluşturmak için Profil sekmesinden kredi satın alın.");
      return;
    }
    setInput("");
    setPreviewTemplate(null);
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: raw };
    setMessages(p => [...p, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const svc = new AIService();
      const reply = await svc.sendMessage(raw, messages.filter(m => m.id !== "welcome"));
      const isDoc = AIService.isDocumentResponse(reply);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(), role: "assistant", content: reply, isDocument: isDoc,
      };
      setMessages(p => [...p, aiMsg]);

      if (isDoc) {
        const nc = await StorageService.useCredit();
        setCredits(nc);
        await StorageService.saveDocument({ content: reply, preview: raw });
        setActiveDoc({ content: reply });

        // Feature 4: Profile nudge — show if no name saved
        const info = await StorageService.getUserInfo();
        if (!info.ad && !info.soyad) {
          setShowProfileNudge(true);
        }
      }
    } catch {
      setMessages(p => [...p, {
        id: Date.now().toString(), role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const copyText = async (text: string) => {
    try {
      const { Clipboard } = await import("expo-clipboard");
      await Clipboard.setStringAsync(text);
      Alert.alert("Kopyalandı", "Belge panoya kopyalandı.");
    } catch {}
  };

  const shareText = async (text: string) => {
    try { await Share.share({ message: text, title: "EvrakAI Belgesi" }); } catch {}
  };

  const resetChat = () =>
    Alert.alert("Yeni Sohbet", "Mevcut sohbet silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Başlat", style: "destructive",
        onPress: () => {
          setMessages([{
            id: "welcome", role: "assistant",
            content: "Merhaba! Hangi belgeyi oluşturmak istediğinizi anlatın.",
          }]);
          setActiveDoc(null);
          setShowProfileNudge(false);
        },
      },
    ]);

  const creditLow = credits > 0 && credits <= 2;
  const creditOut = credits === 0;

  // ── Template preview content ─────────────────────────────────────────────
  const tmplInfo = previewTemplate ? TEMPLATE_INFO[previewTemplate] : null;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={s.nav}>
        <View>
          <Text style={s.navTitle}>EvrakAI</Text>
          <Text style={s.navSub}>Belge Asistanı</Text>
        </View>
        <View style={s.navEnd}>
          <View style={[s.creditPill,
            creditOut && s.creditPillRed,
            creditLow && s.creditPillOrange,
          ]}>
            <View style={[s.creditDot,
              { backgroundColor: creditOut ? Colors.red : creditLow ? Colors.orange : Colors.green },
            ]} />
            <Text style={[s.creditCount,
              creditOut && { color: Colors.red },
              creditLow && { color: Colors.orange },
            ]}>
              {credits} kredi
            </Text>
          </View>
          <TouchableOpacity onPress={resetChat} style={s.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <RotateCcw size={16} color={Colors.label2} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Template chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: Colors.card, maxHeight: 46 }}
        contentContainerStyle={s.chips}>
        {TEMPLATES.map(t => (
          <TouchableOpacity key={t}
            onPress={() => setPreviewTemplate(t)}
            style={[s.chip, previewTemplate === t && s.chipActive]}
            activeOpacity={0.7}>
            <Text style={[s.chipText, previewTemplate === t && s.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.hairline} />

      {/* Messages + Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={s.feed}
          contentContainerStyle={s.feedContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messages.map(m => (
            <View key={m.id} style={[s.row, m.role === "user" && s.rowUser]}>
              {m.role === "assistant" && (
                <View style={s.aiAvatar}><Text style={{ fontSize: 12 }}>⚖</Text></View>
              )}
              <View style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAI]}>
                <Text style={[s.bubbleTxt, m.role === "user" && { color: "#fff" }]}>
                  {m.content}
                </Text>
                {m.isDocument && m.role === "assistant" && (
                  <View style={s.docStrip}>
                    <Text style={s.docBadge}>BELGE HAZIR</Text>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {[
                        { Icon: Copy,    fn: () => copyText(m.content), tip: "Kopyala" },
                        { Icon: Share2,  fn: () => shareText(m.content), tip: "Paylaş" },
                        { Icon: Printer, fn: () => printDocument(m.content), tip: "Yazdır" },
                      ].map(({ Icon, fn }, i) => (
                        <TouchableOpacity key={i} onPress={fn} style={s.docBtn}>
                          <Icon size={13} color={Colors.accent} strokeWidth={2} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          {loading && (
            <View style={s.row}>
              <View style={s.aiAvatar}><Text style={{ fontSize: 12 }}>⚖</Text></View>
              <View style={s.bubbleAI}><PulsingDots /></View>
            </View>
          )}

          {/* Feature 4 — Profile nudge */}
          {showProfileNudge && (
            <View style={s.nudgeCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.nudgeTitle}>Bir daha yazmayın</Text>
                <Text style={s.nudgeSub}>
                  Adınız, TCKN ve adresinizi bir kez kaydedin — tüm belgelere otomatik dolsun.
                </Text>
              </View>
              <View style={s.nudgeActions}>
                <TouchableOpacity
                  onPress={() => { setShowProfileNudge(false); navigation.navigate("Profil"); }}
                  style={s.nudgeBtn}>
                  <Text style={s.nudgeBtnText}>Profili Aç</Text>
                  <ChevronRight size={13} color={Colors.accent} strokeWidth={2.2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowProfileNudge(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color={Colors.label3} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          <Animated.View style={[s.inputWrap, { borderColor: animatedBorder }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Belgenizi anlatın…"
              placeholderTextColor={Colors.label3}
              style={s.input}
              multiline
              maxLength={1200}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
              style={[s.sendBtn, (!input.trim() || loading) && { backgroundColor: Colors.fill, shadowOpacity: 0 }]}
            >
              <Send size={15} color="#fff" strokeWidth={2.2} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.disclaimer}>EvrakAI hukuki tavsiye niteliği taşımaz.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Feature 3 — Template Preview Sheet */}
      <DialogSheet
        visible={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={tmplInfo?.label ?? ""}
        subtitle="Belge önizlemesi — ücretsiz"
        maxHeight="88%"
        footer={
          <GradientButton
            onPress={() => {
              const t = previewTemplate!;
              setPreviewTemplate(null);
              send(`${t} oluştur`);
            }}
            title="Bu Belgeyi Oluştur"
            size="lg"
            style={{ flex: 1 }}
          />
        }
      >
        <View style={{ gap: 18 }}>
          {/* Needed info */}
          <View style={s.previewSection}>
            <Text style={s.previewSectionTitle}>Gerekli Bilgiler</Text>
            {tmplInfo?.needed.map((item, i) => (
              <View key={i} style={s.neededRow}>
                <View style={s.neededDot} />
                <Text style={s.neededText}>{item}</Text>
              </View>
            ))}
            <Text style={s.neededNote}>
              Bilgileriniz profil sekmesinde kayıtlıysa sorulmaz, otomatik eklenir.
            </Text>
          </View>

          {/* Sample doc */}
          <View>
            <Text style={s.previewSectionTitle}>Örnek Belge</Text>
            <MarkdownView content={tmplInfo?.sample ?? ""} />
          </View>
        </View>
      </DialogSheet>

      {/* Document Preview Sheet */}
      <DialogSheet
        visible={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title="Oluşturulan Belge"
        subtitle="Belgeler sekmesine otomatik kaydedildi"
        maxHeight="92%"
        footer={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <GradientButton onPress={() => activeDoc && copyText(activeDoc.content)}
              title="Kopyala" variant="tinted" size="md" style={{ flex: 1 }}
              icon={<Copy size={13} color={Colors.accent} />} />
            <GradientButton onPress={() => activeDoc && printDocument(activeDoc.content)}
              title="PDF/Yazdır" variant="gray" size="md" style={{ flex: 1 }}
              icon={<Printer size={13} color={Colors.label} />} />
            <GradientButton onPress={() => activeDoc && shareText(activeDoc.content)}
              title="Paylaş" variant="filled" size="md" style={{ flex: 1 }}
              icon={<Share2 size={13} color="#fff" />} />
          </View>
        }
      >
        {activeDoc && <MarkdownView content={activeDoc.content} />}
      </DialogSheet>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Nav
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12,
    backgroundColor: Colors.card,
  },
  navTitle: { fontSize: 17, fontWeight: "700", color: Colors.label, letterSpacing: -0.4 },
  navSub:   { fontSize: 11, color: Colors.label3, marginTop: 1 },
  navEnd:   { flexDirection: "row", alignItems: "center", gap: 8 },
  creditPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6,
    backgroundColor: Colors.fill, borderRadius: 20,
  },
  creditPillRed:    { backgroundColor: Colors.redLight },
  creditPillOrange: { backgroundColor: Colors.warningLight },
  creditDot:   { width: 6, height: 6, borderRadius: 3 },
  creditCount: { fontSize: 13, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.fill, alignItems: "center", justifyContent: "center",
  },

  // Chips
  chips: { paddingHorizontal: 16, gap: 7, alignItems: "center", paddingVertical: 9 },
  chip:  {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: Colors.bg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separatorOpaque,
  },
  chipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  chipText:       { fontSize: 13, fontWeight: "500", color: Colors.label2, letterSpacing: -0.1 },
  chipTextActive: { color: Colors.accent, fontWeight: "600" },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  // Feed
  feed:        { flex: 1, backgroundColor: Colors.bg },
  feedContent: { padding: 14, gap: 12, paddingBottom: 8 },
  row:     { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowUser: { flexDirection: "row-reverse" },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginBottom: 2,
  },
  bubble:    { maxWidth: "80%", borderRadius: 18, padding: 13 },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    borderBottomLeftRadius: 4, ...Shadows.xs,
  },
  bubbleUser: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleTxt:  { fontSize: 15, color: Colors.label, lineHeight: 22, letterSpacing: -0.2 },

  // Doc strip
  docStrip: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(88,86,214,0.2)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  docBadge: {
    fontSize: 9, fontWeight: "700", color: Colors.accent, letterSpacing: 0.5,
    backgroundColor: Colors.accentLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  docBtn: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },

  // Profile nudge (feature 4)
  nudgeCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accentMid,
    padding: 14,
    marginTop: 4,
  },
  nudgeTitle: { fontSize: 14, fontWeight: "700", color: Colors.accent, marginBottom: 4 },
  nudgeSub:   { fontSize: 13, color: Colors.accent, opacity: 0.8, lineHeight: 18 },
  nudgeActions: { alignItems: "flex-end", gap: 8, flexShrink: 0 },
  nudgeBtn: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  nudgeBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Template preview sheet content
  previewSection: {
    backgroundColor: Colors.bg,
    borderRadius: 14, padding: 14, gap: 9,
  },
  previewSectionTitle: {
    fontSize: 12, fontWeight: "700", color: Colors.label3,
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4,
  },
  neededRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  neededDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.accent, flexShrink: 0,
  },
  neededText: { fontSize: 14, color: Colors.label, lineHeight: 20 },
  neededNote: {
    fontSize: 12, color: Colors.label3, marginTop: 6, lineHeight: 17,
    paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },

  // Input
  inputBar: {
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: Colors.bg,
    borderRadius: 18, borderWidth: 1.2,
    paddingLeft: 14, paddingRight: 7, paddingVertical: 7,
    gap: 6, marginBottom: 6,
  },
  input: {
    flex: 1, fontSize: 15, color: Colors.label,
    maxHeight: 100, letterSpacing: -0.2,
    paddingTop: 3, paddingBottom: 3,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    ...Shadows.glow,
  },
  disclaimer: { fontSize: 11, color: Colors.label3, textAlign: "center" },
});
