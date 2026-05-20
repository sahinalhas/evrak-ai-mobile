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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Sparkles,
  Send,
  FileText,
  Eye,
  Zap,
  Share2,
  Plus,
  Crown,
  RotateCcw,
} from "lucide-react-native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { AIService, ChatMsg } from "../services/ai";
import { GradientButton, DialogSheet, PulsingDots, ProBanner } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";

const QUICK_CHIPS = [
  { label: "Dilekçe", emoji: "📄" },
  { label: "Kira Sözleşmesi", emoji: "🏠" },
  { label: "İhtarname", emoji: "⚖️" },
  { label: "İstifa Dilekçesi", emoji: "💼" },
  { label: "İzin Talebi", emoji: "🗓️" },
  { label: "Kayıt Dondurma", emoji: "🎓" },
];

const GREETING = "Merhaba! 👋 Hangi belgeyi oluşturmak istersiniz?\n\nTüm bilgileri tek seferde anlatabilirsiniz, eksik varsa ben sorarım.";
const MAX_FREE = 8;

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [docType, setDocType] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [quota, setQuota] = useState(MAX_FREE);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const docCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StorageService.getQuota().then(setQuota);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const showDocCard = () => {
    docCardAnim.setValue(0);
    Animated.spring(docCardAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }).start();
  };

  const handleNewChat = () => {
    Alert.alert("Yeni Sohbet", "Mevcut sohbet silinecek. Devam etmek istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Yeni Başlat",
        onPress: () => {
          setMessages([{ role: "assistant", content: GREETING }]);
          setInput("");
          setDocType(null);
          setGeneratedDoc("");
        },
      },
    ]);
  };

  const handleSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;

    if (quota <= 0) {
      setUpgradeOpen(true);
      return;
    }

    const nextQuota = quota - 1;
    setQuota(nextQuota);
    await StorageService.setQuota(nextQuota);

    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setTyping(true);
    scrollToBottom();

    try {
      const data = await AIService.sendMessage(nextMessages);
      if (data.docType) setDocType(data.docType);

      const updated = [...nextMessages, { role: "assistant" as const, content: data.assistantMessage }];
      setMessages(updated);

      if (data.status === "ready" && data.document) {
        setGeneratedDoc(data.document);
        showDocCard();
        await StorageService.addDocument({
          title: `${data.docType ?? "Belge"} — ${new Date().toLocaleDateString("tr-TR")}`,
          type: data.docType ?? "Genel Belge",
          category: getCategoryForDocType(data.docType),
          content: data.document,
        });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Üzgünüm, şu anda bağlanamıyorum. Lütfen tekrar deneyin." },
      ]);
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  };

  const getCategoryForDocType = (type: string | null): "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" => {
    if (!type) return "Hukuki";
    const t = type.toLowerCase();
    if (t.includes("kira") || t.includes("ihtar")) return "Hukuki";
    if (t.includes("istifa") || t.includes("izin")) return "İş Hayatı";
    if (t.includes("dondurma") || t.includes("öğrenci")) return "Eğitim";
    return "Kişisel";
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: generatedDoc, title: `${docType ?? "Belge"} — EvrakAI` });
    } catch {}
  };

  const quotaPercent = (quota / MAX_FREE) * 100;
  const quotaColor = quota <= 2 ? Colors.destructive : quota <= 4 ? Colors.warning : Colors.success;

  const renderMessage = ({ item, index }: { item: ChatMsg; index: number }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        {!isUser && (
          <View style={styles.avatarDot}>
            <Sparkles size={10} color={Colors.primary} />
          </View>
        )}
        {isUser ? (
          <LinearGradient
            colors={Colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userBubble}
          >
            <Text style={styles.userText}>{item.content}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.assistantBubble}>
            <Text style={styles.assistantText}>{item.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const listData = [...messages];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LinearGradient colors={Colors.gradientPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoIcon}>
            <Sparkles size={14} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.logoTitle}>EvrakAI</Text>
            <Text style={styles.logoSub}>Yapay Zekâ Belge Asistanı</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quota pill */}
          <View style={[styles.quotaPill, { borderColor: quotaColor + "40" }]}>
            <Zap size={11} color={quotaColor} />
            <Text style={[styles.quotaText, { color: quotaColor }]}>{quota}/{MAX_FREE}</Text>
          </View>
          {/* New chat */}
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quota bar */}
      <View style={styles.quotaBarBg}>
        <Animated.View style={[styles.quotaBarFill, { width: `${quotaPercent}%` as any, backgroundColor: quotaColor }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            messages.length <= 2 ? (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsLabel}>Popüler Şablonlar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {QUICK_CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip.label}
                      onPress={() => handleSend(`${chip.label} hazırlamak istiyorum.`)}
                      disabled={typing}
                      activeOpacity={0.75}
                      style={styles.chipBtn}
                    >
                      <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                      <Text style={styles.chipText}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListFooterComponent={
            <>
              {typing && (
                <View style={[styles.messageRow, styles.messageRowAssistant]}>
                  <View style={styles.avatarDot}>
                    <Sparkles size={10} color={Colors.primary} />
                  </View>
                  <View style={[styles.assistantBubble, { paddingVertical: 14 }]}>
                    <PulsingDots />
                  </View>
                </View>
              )}
              {generatedDoc !== "" && (
                <Animated.View
                  style={{
                    opacity: docCardAnim,
                    transform: [{ translateY: docCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  }}
                >
                  <TouchableOpacity onPress={() => setPreviewOpen(true)} activeOpacity={0.88} style={styles.docReadyCard}>
                    <LinearGradient colors={Colors.gradientPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.docReadyIconWrap}>
                      <FileText size={22} color="#fff" />
                    </LinearGradient>
                    <View style={styles.docReadyText}>
                      <Text style={styles.docReadyTitle}>{docType ?? "Belge"} Hazır ✓</Text>
                      <Text style={styles.docReadySub}>Önizlemek için dokunun</Text>
                    </View>
                    <Eye size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </Animated.View>
              )}
              <View style={{ height: 12 }} />
            </>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputArea}>
          {quota <= 2 && quota > 0 && (
            <TouchableOpacity onPress={() => setUpgradeOpen(true)} style={styles.lowQuotaBanner}>
              <Crown size={12} color={Colors.warning} />
              <Text style={styles.lowQuotaText}>Yalnızca {quota} belge kredisi kaldı. Pro'ya geç →</Text>
            </TouchableOpacity>
          )}
          <View style={styles.inputCard}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Belge isteğinizi yazın…"
              placeholderTextColor={Colors.mutedForeground}
              multiline
              style={styles.textInput}
              onSubmitEditing={() => handleSend(input)}
            />
            <TouchableOpacity
              onPress={() => handleSend(input)}
              disabled={!input.trim() || typing}
              style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
            >
              {typing ? (
                <RotateCcw size={14} color="#fff" />
              ) : (
                <Send size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>EvrakAI hukuki tavsiye vermez. Önemli işlemler için avukata danışın.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Document Preview Sheet */}
      <DialogSheet
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`${docType ?? "Belge"} Önizleme`}
        subtitle="Belgenizi kontrol edip paylaşabilirsiniz"
        footer={
          <View style={styles.sheetFooterBtns}>
            <GradientButton
              onPress={handleShare}
              title="Paylaş / Kopyala"
              icon={<Share2 size={15} color="#fff" />}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <MarkdownView content={generatedDoc} maxHeight={380} />
      </DialogSheet>

      {/* Upgrade Sheet */}
      <DialogSheet
        visible={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Pro'ya Geç"
        subtitle="Sınırsız belge ve öncelikli AI erişimi"
      >
        <View style={styles.upgradeContent}>
          {["Sınırsız belge oluşturma", "Öncelikli AI yanıt süresi", "PDF dışa aktarma (yakında)", "Tüm şablonlara erişim"].map((f, i) => (
            <View key={i} style={styles.upgradeFeature}>
              <View style={styles.upgradeCheck}>
                <Text style={styles.upgradeCheckText}>✓</Text>
              </View>
              <Text style={styles.upgradeFeatureText}>{f}</Text>
            </View>
          ))}
          <View style={styles.upgradePriceRow}>
            <Text style={styles.upgradePrice}>₺149</Text>
            <Text style={styles.upgradePriceSub}>/ay</Text>
          </View>
          <GradientButton
            onPress={() => { setUpgradeOpen(false); Alert.alert("Pro", "Ödeme entegrasyonu yakında aktif olacak!"); }}
            title="Pro'ya Geç"
            size="lg"
            style={{ marginTop: 8 }}
          />
          <TouchableOpacity onPress={() => setUpgradeOpen(false)} style={styles.upgradeSkip}>
            <Text style={styles.upgradeSkipText}>Şimdi değil</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  logoTitle: { fontSize: 15, fontWeight: "700", color: Colors.foreground },
  logoSub: { fontSize: 10, color: Colors.mutedForeground, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  quotaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.muted,
  },
  quotaText: { fontSize: 11, fontWeight: "700" },
  newChatBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  quotaBarBg: { height: 2, backgroundColor: Colors.border },
  quotaBarFill: { height: 2, borderRadius: 1 },

  chatContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },

  chipsSection: { marginBottom: 8 },
  chipsLabel: { fontSize: 11, fontWeight: "600", color: Colors.mutedForeground, marginBottom: 10, letterSpacing: 0.3 },
  chipsRow: { gap: 8, paddingRight: 4 },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    ...Shadows.xs,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: "500", color: Colors.foreground },

  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 7 },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAssistant: { justifyContent: "flex-start" },

  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  userBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    ...Shadows.xs,
  },
  userText: { color: "#fff", fontSize: 14, lineHeight: 20 },

  assistantBubble: {
    maxWidth: "82%",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    ...Shadows.xs,
  },
  assistantText: { color: Colors.foreground, fontSize: 14, lineHeight: 20 },

  docReadyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary + "60",
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
    ...Shadows.card,
  },
  docReadyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docReadyText: { flex: 1 },
  docReadyTitle: { fontSize: 14, fontWeight: "700", color: Colors.foreground },
  docReadySub: { fontSize: 11, color: Colors.mutedForeground, marginTop: 2 },

  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 4 : 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lowQuotaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
  },
  lowQuotaText: { fontSize: 11, color: Colors.warningForeground, fontWeight: "600", flex: 1 },
  inputCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    minHeight: 36,
    maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    ...Shadows.sm,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  inputHint: { fontSize: 9, color: Colors.mutedForeground, textAlign: "center", marginTop: 6 },

  sheetFooterBtns: { flexDirection: "row", gap: 10 },

  upgradeContent: { gap: 14 },
  upgradeFeature: { flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeCheckText: { fontSize: 12, color: Colors.success, fontWeight: "700" },
  upgradeFeatureText: { fontSize: 14, color: Colors.foreground },
  upgradePriceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginTop: 4 },
  upgradePrice: { fontSize: 36, fontWeight: "700", color: Colors.primary },
  upgradePriceSub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 6, marginLeft: 4 },
  upgradeSkip: { alignItems: "center", paddingVertical: 10 },
  upgradeSkipText: { fontSize: 13, color: Colors.mutedForeground },
});
