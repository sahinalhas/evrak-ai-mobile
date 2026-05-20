import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Send, Copy, Share2, RotateCcw, ChevronDown } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { GradientButton, PulsingDots, DialogSheet } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { AIService } from "../services/ai";
import { StorageService } from "../services/storage";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDocument?: boolean;
};

const TEMPLATES = [
  "Dilekçe", "İzin Talebi", "İstifa", "İş Başvurusu",
  "Şikayet", "Taahhütname", "Referans Mektubu", "Kayıt Dondurma",
  "Nakil Talebi", "Not İtirazı", "Bilgi Edinme",
];

export const ChatScreen: React.FC = () => {
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

  const send = async (text?: string) => {
    const raw = (text ?? input).trim();
    if (!raw || loading) return;
    if (credits <= 0) {
      Alert.alert("Kredi Yok", "Belge oluşturmak için Profil sekmesinden kredi satın alın.");
      return;
    }
    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: raw };
    setMessages(p => [...p, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const svc = new AIService();
      const reply = await svc.sendMessage(raw, messages.filter(m => m.id !== "welcome"));
      const isDoc = AIService.isDocumentResponse(reply);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply, isDocument: isDoc };
      setMessages(p => [...p, aiMsg]);
      if (isDoc) {
        const nc = await StorageService.useCredit();
        setCredits(nc);
        await StorageService.saveDocument({ content: reply, preview: raw });
        setActiveDoc({ content: reply });
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
          setMessages([{ id: "welcome", role: "assistant", content: "Merhaba! Hangi belgeyi oluşturmak istediğinizi anlatın." }]);
          setActiveDoc(null);
        },
      },
    ]);

  const creditLow = credits > 0 && credits <= 2;
  const creditOut = credits === 0;

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
          <View style={[s.creditPill, creditOut && s.creditPillRed, creditLow && s.creditPillOrange]}>
            <View style={[
              s.creditDot,
              { backgroundColor: creditOut ? Colors.red : creditLow ? Colors.orange : Colors.green },
            ]} />
            <Text style={[
              s.creditCount,
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
          <TouchableOpacity key={t} onPress={() => send(`${t} oluştur`)}
            style={s.chip} activeOpacity={0.7}>
            <Text style={s.chipText}>{t}</Text>
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
                <View style={s.aiAvatar}>
                  <Text style={{ fontSize: 12 }}>⚖</Text>
                </View>
              )}
              <View style={[s.bubble, m.role === "user" ? s.bubbleUser : s.bubbleAI]}>
                <Text style={[s.bubbleTxt, m.role === "user" && { color: "#fff" }]}>
                  {m.content}
                </Text>
                {m.isDocument && m.role === "assistant" && (
                  <View style={s.docStrip}>
                    <Text style={s.docBadge}>BELGE OLUŞTURULDU</Text>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {[
                        { Icon: Copy,      fn: () => copyText(m.content) },
                        { Icon: Share2,    fn: () => shareText(m.content) },
                        { Icon: ChevronDown, fn: () => setActiveDoc({ content: m.content }) },
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

      {/* Doc sheet */}
      <DialogSheet
        visible={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title="Oluşturulan Belge"
        subtitle="Belgeler sekmesine otomatik kaydedildi"
        maxHeight="92%"
        footer={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GradientButton onPress={() => activeDoc && copyText(activeDoc.content)}
              title="Kopyala" variant="tinted" size="md" style={{ flex: 1 }}
              icon={<Copy size={13} color={Colors.accent} />} />
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
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.label2, letterSpacing: -0.1 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  // Feed
  feed:        { flex: 1, backgroundColor: Colors.bg },
  feedContent: { padding: 14, gap: 12, paddingBottom: 8 },

  // Bubbles
  row:     { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowUser: { flexDirection: "row-reverse" },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginBottom: 2,
  },
  bubble:     { maxWidth: "80%", borderRadius: 18, padding: 13 },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
    borderBottomLeftRadius: 4, ...Shadows.xs,
  },
  bubbleUser: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleTxt:  { fontSize: 15, color: Colors.label, lineHeight: 22, letterSpacing: -0.2 },

  // Doc strip inside bubble
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
