import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Send, Copy, Share2, RotateCcw, Printer, X, ChevronRight, Sparkles, FileCheck } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { GradientButton, PulsingDots, DialogSheet } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { AIService, ChatMsg } from "../services/ai";
import { StorageService } from "../services/storage";
import { printDocument } from "../utils/printDocument";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDocument?: boolean;
  documentContent?: string;
};

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
    sample: "# İŞ BAŞVURU YAZISI\n\n**…………… İnsan Kaynakları Departmanı'na,**\n\n…………… pozisyonuna başvurmak istediğimi saygıyla bildiririm.",
  },
  "Şikayet": {
    label: "Şikayet Dilekçesi",
    needed: ["Şikayetinizin konusu", "Kurumun veya kişinin adı", "Yaşanan olay ve tarihi", "Talebiniz"],
    sample: "# ŞİKAYET DİLEKÇESİ\n\n**…………… Müdürlüğü'ne,**\n\n…………… tarihinde yaşanan olay nedeniyle şikayetçi olduğumu bildiriyorum.",
  },
  "Taahhütname": {
    label: "Taahhütname",
    needed: ["Taahhüt konusu (davranışsal)", "Karşı taraf veya kurum", "Taahhüt süresi (varsa)", "Adınız ve TC kimlik no"],
    sample: "# TAAHHÜTNAME\n\nBen, aşağıda imzası bulunan …………… bundan böyle …………… konusunda üzerime düşen yükümlülükleri yerine getireceğimi taahhüt ederim.",
  },
  "Referans": {
    label: "Referans Mektubu",
    needed: ["Referans verilen kişinin adı ve görevi", "Birlikte çalışma süresi", "Öne çıkan 2-3 özellik", "Referans verenin adı ve unvanı"],
    sample: "# REFERANS MEKTUBU\n\n…………… ile …………… süre boyunca birlikte çalışma fırsatı buldum.",
  },
  "Kayıt Dondur": {
    label: "Kayıt Dondurma",
    needed: ["Üniversite / okul ve bölüm adı", "Öğrenci numarası", "Dondurma gerekçesi", "Dondurulmak istenen dönem"],
    sample: "# KAYIT DONDURMA TALEBİ\n\n**Fakülte Dekanlığı'na,**\n\n…………… Bölümü öğrencisi olarak, 2026-2027 Güz dönemi için kaydımın dondurulmasını talep ediyorum.",
  },
  "Nakil": {
    label: "Nakil Talebi",
    needed: ["Mevcut okul / bölüm", "Nakil olmak istediğiniz yer", "Nakil gerekçesi", "Adınız ve öğrenci numarası"],
    sample: "# NAKİL TALEBİ\n\n**Öğrenci İşleri Daire Başkanlığı'na,**\n\n…………… bölümünden …………… bölümüne nakil olmak istediğimi arz ederim.",
  },
  "Not İtirazı": {
    label: "Not / Sınav İtirazı",
    needed: ["Ders ve öğretim görevlisi adı", "Sınav tarihi ve türü", "İtiraz gerekçeniz", "Öğrenci numarası"],
    sample: "# SINAV SONUCU İTİRAZ DİLEKÇESİ\n\n**Öğretim Görevlisi'ne,**\n\n…………… dersi sınavına ait notuma itiraz etmek istiyorum.",
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
  const [inputFocused, setInputFocused] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{ content: string } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    StorageService.getCredits().then(setCredits);
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
  const animatedShadow = borderAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 0.14],
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
      const history: ChatMsg[] = [
        ...messages
          .filter(m => m.id !== "welcome")
          .map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: raw },
      ];

      const response = await AIService.sendMessage(history);
      const isDoc = response.status === "ready" && !!response.document;
      const bubbleContent = response.assistantMessage;
      const docContent = response.document ?? undefined;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: bubbleContent,
        isDocument: isDoc,
        documentContent: docContent,
      };
      setMessages(p => [...p, aiMsg]);

      if (isDoc && docContent) {
        const nc = await StorageService.useCredit();
        setCredits(nc);
        await StorageService.saveDocument({ content: docContent, preview: raw });
        setActiveDoc({ content: docContent });

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
      const Clipboard = await import("expo-clipboard");
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
  const tmplInfo = previewTemplate ? TEMPLATE_INFO[previewTemplate] : null;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoMark}>
            <Sparkles size={13} color="#fff" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={s.headerTitle}>EvrakAI</Text>
            <Text style={s.headerSub}>Belge Asistanı</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={[
            s.creditBadge,
            creditOut && s.creditBadgeRed,
            creditLow && s.creditBadgeOrange,
          ]}>
            <View style={[s.creditDot, {
              backgroundColor: creditOut ? Colors.red : creditLow ? Colors.orange : Colors.green,
            }]} />
            <Text style={[s.creditText,
              creditOut && { color: Colors.red },
              creditLow && { color: Colors.orange },
            ]}>
              {credits} kredi
            </Text>
          </View>
          <TouchableOpacity onPress={resetChat} style={s.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <RotateCcw size={14} color={Colors.label3} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Template chips ── */}
      <View style={s.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsContent}
        >
          {TEMPLATES.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setPreviewTemplate(t)}
              style={[s.chip, previewTemplate === t && s.chipActive]}
              activeOpacity={0.72}
            >
              <Text style={[s.chipText, previewTemplate === t && s.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Feed + Input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
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
                <View style={s.aiAvatar}>
                  <Sparkles size={10} color={Colors.accent} strokeWidth={2.2} />
                </View>
              )}
              <View style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAI]}>
                <Text style={[s.bubbleTxt, m.role === "user" && s.bubbleTxtUser]}>
                  {m.content}
                </Text>
                {m.isDocument && m.role === "assistant" && (
                  <View style={s.docStrip}>
                    <View style={s.docBadgeWrap}>
                      <FileCheck size={10} color={Colors.accent} strokeWidth={2.5} />
                      <Text style={s.docBadge}>BELGE HAZIR</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {[
                        { Icon: Copy,    fn: () => copyText(m.documentContent ?? m.content) },
                        { Icon: Share2,  fn: () => shareText(m.documentContent ?? m.content) },
                        { Icon: Printer, fn: () => printDocument(m.documentContent ?? m.content) },
                      ].map(({ Icon, fn }, i) => (
                        <TouchableOpacity key={i} onPress={fn} style={s.docBtn}>
                          <Icon size={12} color={Colors.accent} strokeWidth={2.2} />
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
              <View style={s.aiAvatar}>
                <Sparkles size={10} color={Colors.accent} strokeWidth={2.2} />
              </View>
              <View style={[s.bubble, s.bubbleAI, s.bubbleLoading]}>
                <PulsingDots />
              </View>
            </View>
          )}

          {showProfileNudge && (
            <View style={s.nudge}>
              <View style={s.nudgeLeft}>
                <Text style={s.nudgeTitle}>Bir daha yazmayın</Text>
                <Text style={s.nudgeSub}>Bilgilerinizi bir kez kaydedin — tüm belgelere otomatik dolsun.</Text>
              </View>
              <View style={s.nudgeRight}>
                <TouchableOpacity
                  onPress={() => { setShowProfileNudge(false); navigation.navigate("Profil"); }}
                  style={s.nudgeBtn}
                >
                  <Text style={s.nudgeBtnTxt}>Profil</Text>
                  <ChevronRight size={11} color={Colors.accent} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowProfileNudge(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={13} color={Colors.label3} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={s.inputBar}>
          <Animated.View style={[
            s.inputWrap,
            {
              borderColor: animatedBorder,
              shadowColor: "#5B4CF5",
              shadowOpacity: animatedShadow,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: inputFocused ? 3 : 1,
            },
          ]}>
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
              activeOpacity={0.80}
              style={[
                s.sendBtn,
                (!input.trim() || loading) && s.sendBtnDisabled,
              ]}
            >
              <Send size={14} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.disclaimer}>EvrakAI hukuki tavsiye niteliği taşımaz.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* ── Template Preview Sheet ── */}
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
        <View style={{ gap: 22 }}>
          <View style={s.previewSection}>
            <Text style={s.previewSectionLabel}>GEREKLİ BİLGİLER</Text>
            <View style={{ gap: 10 }}>
              {tmplInfo?.needed.map((item, i) => (
                <View key={i} style={s.neededRow}>
                  <View style={s.neededNum}>
                    <Text style={s.neededNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={s.neededText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={s.autoNote}>
              <Text style={s.autoNoteText}>
                💡 Profilde kayıtlı bilgiler otomatik eklenir, tekrar sorulmaz.
              </Text>
            </View>
          </View>

          <View>
            <Text style={s.previewSectionLabel}>ÖRNEK BELGE</Text>
            <MarkdownView content={tmplInfo?.sample ?? ""} />
          </View>
        </View>
      </DialogSheet>

      {/* ── Document Preview Sheet ── */}
      <DialogSheet
        visible={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title="Oluşturulan Belge"
        subtitle="Belgeler sekmesine otomatik kaydedildi"
        maxHeight="92%"
        footer={
          <>
            <GradientButton
              onPress={() => activeDoc && copyText(activeDoc.content)}
              title="Kopyala" variant="tinted" size="md" style={{ flex: 1 }}
              icon={<Copy size={13} color={Colors.accent} />}
            />
            <GradientButton
              onPress={() => activeDoc && printDocument(activeDoc.content)}
              title="PDF" variant="gray" size="md" style={{ flex: 1 }}
              icon={<Printer size={13} color={Colors.label} />}
            />
            <GradientButton
              onPress={() => activeDoc && shareText(activeDoc.content)}
              title="Paylaş" variant="filled" size="md" style={{ flex: 1 }}
              icon={<Share2 size={13} color="#fff" />}
            />
          </>
        }
      >
        {activeDoc && <MarkdownView content={activeDoc.content} />}
      </DialogSheet>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 11 },
  logoMark: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    ...Shadows.glow,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.label, letterSpacing: -0.5 },
  headerSub:   { fontSize: 11, color: Colors.label3, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  creditBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6,
    backgroundColor: Colors.fill, borderRadius: 22,
  },
  creditBadgeRed:    { backgroundColor: Colors.redLight },
  creditBadgeOrange: { backgroundColor: Colors.orangeLight },
  creditDot:  { width: 6, height: 6, borderRadius: 3 },
  creditText: { fontSize: 12, fontWeight: "700", color: Colors.label, letterSpacing: -0.1 },

  iconBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
  },

  // ── Chips
  chipsWrapper: {
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  chipsContent: {
    paddingHorizontal: 16, paddingVertical: 11, gap: 7,
    alignItems: "center", flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 22,
    backgroundColor: Colors.fill,
  },
  chipActive:     { backgroundColor: Colors.accentLight },
  chipText:       { fontSize: 13, fontWeight: "500", color: Colors.label2 },
  chipTextActive: { color: Colors.accent, fontWeight: "700" },

  // ── Feed
  feed:        { flex: 1, backgroundColor: Colors.bg },
  feedContent: { padding: 18, gap: 14, paddingBottom: 12 },

  row:     { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  rowUser: { flexDirection: "row-reverse" },

  aiAvatar: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: Colors.accentLight,
    borderWidth: 1, borderColor: Colors.accentMid,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginBottom: 2,
  },

  bubble: { maxWidth: "82%", borderRadius: 22, paddingHorizontal: 15, paddingVertical: 12 },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    borderBottomLeftRadius: 6,
    ...Shadows.sm,
  },
  bubbleLoading: { paddingVertical: 15 },
  bubbleUser: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 6,
    ...Shadows.glow,
  },
  bubbleTxt:     { fontSize: 15, color: Colors.label, lineHeight: 23, letterSpacing: -0.15 },
  bubbleTxtUser: { color: "#fff" },

  // ── Doc strip
  docStrip: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(91,76,245,0.12)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  docBadgeWrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 9,
  },
  docBadge: { fontSize: 10, fontWeight: "800", color: Colors.accent, letterSpacing: 0.4 },
  docBtn: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },

  // ── Profile nudge
  nudge: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accentMid,
    paddingHorizontal: 16, paddingVertical: 15,
    marginTop: 2,
    ...Shadows.sm,
  },
  nudgeLeft:  { flex: 1 },
  nudgeRight: { alignItems: "flex-end", gap: 10, flexShrink: 0 },
  nudgeTitle: { fontSize: 13, fontWeight: "800", color: Colors.label, marginBottom: 3, letterSpacing: -0.3 },
  nudgeSub:   { fontSize: 12, color: Colors.label2, lineHeight: 17 },
  nudgeBtn: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: Colors.accentLight,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  nudgeBtnTxt: { fontSize: 12, fontWeight: "700", color: Colors.accent },

  // ── Input bar
  inputBar: {
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    backgroundColor: Colors.bg,
    borderRadius: 18, borderWidth: 1.5,
    paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
  },
  input: {
    flex: 1, fontSize: 15, color: Colors.label,
    letterSpacing: -0.15, maxHeight: 110,
    paddingTop: 4, paddingBottom: 4,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    ...Shadows.glowSm,
  },
  sendBtnDisabled: { backgroundColor: Colors.label3, shadowOpacity: 0 },
  disclaimer: {
    fontSize: 11, color: Colors.label3, textAlign: "center",
    marginTop: 7, letterSpacing: -0.05,
  },

  // ── Preview sheet
  previewSection: {
    backgroundColor: Colors.bg,
    borderRadius: 18, padding: 18, gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  previewSectionLabel: {
    fontSize: 11, fontWeight: "800", color: Colors.label3, letterSpacing: 0.9,
  },
  neededRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  neededNum: {
    width: 26, height: 26, borderRadius: 9,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  neededNumTxt: { fontSize: 12, fontWeight: "800", color: Colors.accent },
  neededText:   { fontSize: 14, color: Colors.label, flex: 1, lineHeight: 20 },
  autoNote: {
    backgroundColor: Colors.fillSecondary,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  autoNoteText: { fontSize: 13, color: Colors.label2, lineHeight: 19 },
});
