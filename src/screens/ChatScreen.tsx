import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
  Animated,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Send, FileText, Eye, Share2, Plus, RotateCcw, Sparkles, Download, Mail, Copy, MessageCircle } from "lucide-react-native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { AIService, ChatMsg } from "../services/ai";
import { GradientButton, DialogSheet, PulsingDots } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { exportToPDF, copyToClipboard, shareViaWhatsApp, shareViaEmail } from "../services/pdfExport";

const QUICK_CHIPS = [
  { label: "Dilekçe", emoji: "📄" },
  { label: "Kira Sözleşmesi", emoji: "🏠" },
  { label: "İhtarname", emoji: "⚖️" },
  { label: "İstifa Dilekçesi", emoji: "💼" },
  { label: "İzin Talebi", emoji: "🗓️" },
  { label: "Kayıt Dondurma", emoji: "🎓" },
  { label: "Vekaletname", emoji: "✍️" },
  { label: "İş Sözleşmesi", emoji: "🤝" },
  { label: "Şikayet Dilekçesi", emoji: "📢" },
];

const GREETING = "Merhaba! Hangi belgeyi oluşturmak istersiniz?\n\nTüm bilgileri tek seferde anlatabilirsiniz, eksik varsa ben sorarım.";
const MAX_FREE = 8;

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [docType, setDocType] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [quota, setQuota] = useState(MAX_FREE);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<FlatList>(null);
  const docCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { StorageService.getQuota().then(setQuota); }, []);

  const scrollToBottom = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const showDocCard = () => {
    docCardAnim.setValue(0);
    Animated.spring(docCardAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }).start();
  };

  const handleNewChat = () => {
    Alert.alert("Yeni Sohbet", "Mevcut sohbet silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Yeni Başlat", onPress: () => {
        setMessages([{ role: "assistant", content: GREETING }]);
        setInput(""); setDocType(null); setGeneratedDoc("");
      }},
    ]);
  };

  const handleSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;
    if (quota <= 0) { setUpgradeOpen(true); return; }

    const nextQuota = quota - 1;
    setQuota(nextQuota);
    await StorageService.setQuota(nextQuota);

    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setTyping(true);
    scrollToBottom();

    try {
      const data = await AIService.sendMessage(next);
      if (data.docType) setDocType(data.docType);
      const updated = [...next, { role: "assistant" as const, content: data.assistantMessage }];
      setMessages(updated);
      if (data.status === "ready" && data.document) {
        setGeneratedDoc(data.document);
        showDocCard();
        await StorageService.addDocument({
          title: `${data.docType ?? "Belge"} — ${new Date().toLocaleDateString("tr-TR")}`,
          type: data.docType ?? "Genel Belge",
          category: getCat(data.docType),
          content: data.document,
        });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Bağlantı hatası. Lütfen tekrar deneyin." }]);
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  };

  const getCat = (type: string | null): "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" => {
    if (!type) return "Hukuki";
    const t = type.toLowerCase();
    if (t.includes("kira") || t.includes("ihtar") || t.includes("vekalet") || t.includes("şikayet")) return "Hukuki";
    if (t.includes("istifa") || t.includes("izin") || t.includes("iş sözleşmesi") || t.includes("taahhüt")) return "İş Hayatı";
    if (t.includes("dondurma") || t.includes("öğrenci")) return "Eğitim";
    return "Kişisel";
  };

  const handleNativeShare = async () => {
    try { await Share.share({ message: generatedDoc, title: `${docType ?? "Belge"} — EvrakAI` }); } catch {}
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(generatedDoc);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      Alert.alert("Kopyalandı", "Belge panoya kopyalandı (manuel yol).");
    }
  };

  const handlePdfExport = () => {
    setPreviewOpen(false);
    setTimeout(() => exportToPDF(generatedDoc, docType ?? "Belge"), 300);
  };

  const handleWhatsApp = () => {
    setShareOpen(false);
    shareViaWhatsApp(generatedDoc);
  };

  const handleEmail = () => {
    setShareOpen(false);
    shareViaEmail(generatedDoc, `${docType ?? "Belge"} — EvrakAI`);
  };

  const quotaColor = quota <= 2 ? Colors.red : quota <= 4 ? Colors.orange : Colors.accent;

  const renderMessage = ({ item }: { item: ChatMsg }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Sparkles size={10} color={Colors.accent} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>⚖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>EvrakAI</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.quotaBadge, { borderColor: quotaColor + "50" }]}>
            <View style={[styles.quotaDot, { backgroundColor: quotaColor }]} />
            <Text style={[styles.quotaText, { color: quotaColor }]}>{quota}/{MAX_FREE} kredi</Text>
          </View>
          <TouchableOpacity onPress={handleNewChat} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={17} color={Colors.accent} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            messages.length <= 2 ? (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsLabel}>Sık kullanılan şablonlar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {QUICK_CHIPS.map((c) => (
                    <TouchableOpacity
                      key={c.label}
                      onPress={() => handleSend(`${c.label} hazırlamak istiyorum.`)}
                      disabled={typing}
                      activeOpacity={0.65}
                      style={styles.chip}
                    >
                      <Text style={styles.chipEmoji}>{c.emoji}</Text>
                      <Text style={styles.chipText}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListFooterComponent={
            <>
              {typing && (
                <View style={[styles.msgRow, styles.msgRowAI]}>
                  <View style={styles.aiAvatar}>
                    <Sparkles size={10} color={Colors.accent} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                    <PulsingDots />
                  </View>
                </View>
              )}
              {generatedDoc !== "" && (
                <Animated.View style={{
                  opacity: docCardAnim,
                  transform: [{ scale: docCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                  marginTop: 10,
                }}>
                  <View style={styles.docCard}>
                    <TouchableOpacity onPress={() => setPreviewOpen(true)} activeOpacity={0.75} style={styles.docCardMain}>
                      <View style={styles.docCardIcon}>
                        <FileText size={18} color={Colors.accent} strokeWidth={1.5} />
                      </View>
                      <View style={styles.docCardText}>
                        <Text style={styles.docCardTitle}>{docType ?? "Belge"} hazırlandı</Text>
                        <Text style={styles.docCardSub}>Önizlemek için dokunun</Text>
                      </View>
                      <Eye size={16} color={Colors.mutedForeground} strokeWidth={1.5} />
                    </TouchableOpacity>
                    <View style={styles.docCardActions}>
                      <TouchableOpacity onPress={handlePdfExport} style={styles.docAction} activeOpacity={0.7}>
                        <Download size={14} color={Colors.accent} strokeWidth={1.8} />
                        <Text style={styles.docActionText}>PDF</Text>
                      </TouchableOpacity>
                      <View style={styles.docActionDivider} />
                      <TouchableOpacity onPress={() => setShareOpen(true)} style={styles.docAction} activeOpacity={0.7}>
                        <Share2 size={14} color={Colors.accent} strokeWidth={1.8} />
                        <Text style={styles.docActionText}>Paylaş</Text>
                      </TouchableOpacity>
                      <View style={styles.docActionDivider} />
                      <TouchableOpacity onPress={handleCopy} style={styles.docAction} activeOpacity={0.7}>
                        <Copy size={14} color={copied ? Colors.green : Colors.accent} strokeWidth={1.8} />
                        <Text style={[styles.docActionText, copied && { color: Colors.green }]}>
                          {copied ? "Kopyalandı!" : "Kopyala"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              )}
              <View style={{ height: 16 }} />
            </>
          }
        />

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Bir belge talep edin…"
              placeholderTextColor={Colors.mutedForeground}
              multiline
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => handleSend(input)}
              disabled={!input.trim() || typing}
              style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
            >
              {typing
                ? <RotateCcw size={14} color="#fff" strokeWidth={2} />
                : <Send size={14} color="#fff" strokeWidth={2} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>EvrakAI hukuki tavsiye vermez. Önemli işlemler için avukata danışın.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Preview Sheet */}
      <DialogSheet
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={docType ?? "Belge Önizleme"}
        subtitle="Belgenizi inceleyip paylaşabilirsiniz"
        footer={
          <View style={styles.previewFooter}>
            <TouchableOpacity onPress={handlePdfExport} style={styles.pdfBtn} activeOpacity={0.75}>
              <Download size={16} color={Colors.accent} strokeWidth={1.8} />
              <Text style={styles.pdfBtnText}>PDF İndir</Text>
            </TouchableOpacity>
            <GradientButton
              onPress={() => { setPreviewOpen(false); setShareOpen(true); }}
              title="Paylaş"
              icon={<Share2 size={15} color="#fff" />}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <MarkdownView content={generatedDoc} maxHeight={380} />
      </DialogSheet>

      {/* Share Options Sheet */}
      <DialogSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Belgeyi Paylaş"
        subtitle="Paylaşım yöntemini seçin"
      >
        <View style={styles.shareOptions}>
          <TouchableOpacity onPress={handleWhatsApp} style={styles.shareOption} activeOpacity={0.75}>
            <View style={[styles.shareIcon, { backgroundColor: "#25D36620" }]}>
              <Text style={{ fontSize: 22 }}>💬</Text>
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>WhatsApp</Text>
              <Text style={styles.shareOptionDesc}>WhatsApp üzerinden gönder</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEmail} style={styles.shareOption} activeOpacity={0.75}>
            <View style={[styles.shareIcon, { backgroundColor: Colors.blue + "20" }]}>
              <Mail size={22} color={Colors.blue} strokeWidth={1.5} />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>E-posta</Text>
              <Text style={styles.shareOptionDesc}>E-posta uygulamasını aç</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCopy} style={styles.shareOption} activeOpacity={0.75}>
            <View style={[styles.shareIcon, { backgroundColor: Colors.accentLight }]}>
              <Copy size={22} color={Colors.accent} strokeWidth={1.5} />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>{copied ? "Kopyalandı! ✓" : "Panoya Kopyala"}</Text>
              <Text style={styles.shareOptionDesc}>Metni kopyala, istediğin yere yapıştır</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setShareOpen(false); handleNativeShare(); }} style={styles.shareOption} activeOpacity={0.75}>
            <View style={[styles.shareIcon, { backgroundColor: Colors.muted }]}>
              <Share2 size={22} color={Colors.label} strokeWidth={1.5} />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={styles.shareOptionTitle}>Diğer Uygulamalar</Text>
              <Text style={styles.shareOptionDesc}>Sistem paylaşım menüsünü aç</Text>
            </View>
          </TouchableOpacity>
        </View>
      </DialogSheet>

      {/* Upgrade Sheet */}
      <DialogSheet
        visible={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Pro Plana Geç"
        subtitle="Sınırsız belge ve gelişmiş özellikler"
      >
        <View style={styles.upgradeList}>
          {["Sınırsız belge oluşturma", "Öncelikli AI yanıt süresi", "PDF dışa aktarma", "WhatsApp & E-posta paylaşımı", "Tüm şablonlara erişim"].map((f, i) => (
            <View key={i} style={styles.upgradeRow}>
              <Text style={styles.upgradeCheck}>✓</Text>
              <Text style={styles.upgradeRowText}>{f}</Text>
            </View>
          ))}
          <View style={styles.upgradePriceRow}>
            <Text style={styles.upgradePrice}>₺149</Text>
            <Text style={styles.upgradePeriod}>/ay</Text>
          </View>
          <GradientButton
            onPress={() => { setUpgradeOpen(false); Alert.alert("Pro", "Ödeme entegrasyonu yakında aktif olacak!"); }}
            title="Pro'ya Geç"
            size="lg"
            style={{ marginTop: 4 }}
          />
          <TouchableOpacity onPress={() => setUpgradeOpen(false)} style={styles.skipBtn}>
            <Text style={styles.skipText}>Şimdi değil</Text>
          </TouchableOpacity>
        </View>
      </DialogSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  logoGlyph: { fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: Colors.label, letterSpacing: -0.4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  quotaBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, backgroundColor: Colors.background,
  },
  quotaDot: { width: 6, height: 6, borderRadius: 3 },
  quotaText: { fontSize: 12, fontWeight: "500" },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },

  chatContent: { padding: 16, gap: 10, flexGrow: 1 },

  chipsSection: { marginBottom: 4 },
  chipsLabel: { fontSize: 12, fontWeight: "500", color: Colors.mutedForeground, marginBottom: 10, letterSpacing: 0.1 },
  chipsRow: { gap: 7, paddingRight: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separatorOpaque,
    borderRadius: 20, ...Shadows.xs,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, color: Colors.label, letterSpacing: -0.1 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 7 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { backgroundColor: Colors.accent, borderBottomRightRadius: 5 },
  bubbleAI: {
    backgroundColor: Colors.card, borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator, borderBottomLeftRadius: 5, ...Shadows.xs,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, letterSpacing: -0.2 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAI: { color: Colors.label },
  typingBubble: { paddingVertical: 14 },

  docCard: {
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separatorOpaque,
    borderRadius: 14, ...Shadows.sm, overflow: "hidden",
  },
  docCardMain: {
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 12,
  },
  docCardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  docCardText: { flex: 1 },
  docCardTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  docCardSub: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  docCardActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  docAction: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 10,
  },
  docActionText: { fontSize: 12, color: Colors.accent, fontWeight: "500" },
  docActionDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  inputArea: {
    paddingHorizontal: 12, paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 4 : 12,
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: Colors.background,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separatorOpaque,
    borderRadius: 16, paddingLeft: 14, paddingRight: 6, paddingVertical: 6,
  },
  textInput: {
    flex: 1, fontSize: 15, color: Colors.label,
    minHeight: 36, maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 7 : 5,
    paddingBottom: Platform.OS === "ios" ? 7 : 5,
    letterSpacing: -0.2,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center", justifyContent: "center", marginLeft: 6,
  },
  sendBtnDisabled: { backgroundColor: Colors.muted },
  disclaimer: { fontSize: 10, color: Colors.mutedForeground, textAlign: "center", marginTop: 7, letterSpacing: 0.1 },

  previewFooter: { flexDirection: "row", gap: 10, alignItems: "center" },
  pdfBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, height: 44,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.accentMid,
    backgroundColor: Colors.accentLight,
  },
  pdfBtnText: { fontSize: 14, fontWeight: "600", color: Colors.accent },

  shareOptions: { gap: 8 },
  shareOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  shareIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  shareOptionText: { flex: 1 },
  shareOptionTitle: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  shareOptionDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },

  upgradeList: { gap: 12 },
  upgradeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  upgradeCheck: { fontSize: 13, color: Colors.green, fontWeight: "700", width: 20, textAlign: "center" },
  upgradeRowText: { fontSize: 15, color: Colors.label, letterSpacing: -0.2 },
  upgradePriceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginTop: 6 },
  upgradePrice: { fontSize: 40, fontWeight: "700", color: Colors.accent, letterSpacing: -1 },
  upgradePeriod: { fontSize: 15, color: Colors.mutedForeground, marginBottom: 8, marginLeft: 4 },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14, color: Colors.mutedForeground },
});
