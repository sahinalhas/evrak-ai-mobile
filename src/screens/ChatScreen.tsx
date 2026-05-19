import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Sparkles,
  Send,
  Mic,
  FileText,
  Eye,
  Zap,
  Download,
  Share2,
} from "lucide-react-native";
import { Colors, Shadows, Typography } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { AIService, ChatMsg } from "../services/ai";
import { GradientButton, DialogSheet, PulsingDots } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";

const QUICK_CHIPS = [
  "Dilekçe",
  "Kira Sözleşmesi",
  "İhtarname",
  "İstifa Dilekçesi",
  "İzin Talebi",
  "Kayıt Dondurma",
];

const GREETING =
  "Merhaba 👋 Bugün hangi belgeyi oluşturmak istersiniz? Dilerseniz tüm bilgileri tek seferde anlatabilirsiniz, eksik kalan varsa sorarım.";

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [docType, setDocType] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [quota, setQuota] = useState(8);

  const sendDisabled = !input.trim() || typing;
  const scrollRef = useRef<ScrollView>(null);

  // Load active data on mount / focus
  useEffect(() => {
    const loadInitialData = async () => {
      const activeQuota = await StorageService.getQuota();
      setQuota(activeQuota);
    };
    loadInitialData();
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, typing]);

  const handleSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;

    if (quota <= 0) {
      Alert.alert(
        "Kotan Yetersiz",
        "Mesaj kotanız doldu. Profil sayfasından kota uzatabilirsiniz.",
        [{ text: "Tamam" }]
      );
      return;
    }

    const nextQuota = quota - 1;
    setQuota(nextQuota);
    await StorageService.setQuota(nextQuota);

    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setTyping(true);

    try {
      const data = await AIService.sendMessage(nextMessages);
      
      if (data.docType) setDocType(data.docType);
      
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.assistantMessage },
      ]);

      if (data.status === "ready" && data.document) {
        setGeneratedDoc(data.document);
        
        // Save the document persistently using storage service
        await StorageService.addDocument({
          title: `${data.docType ?? "Belge"} (${new Date().toLocaleDateString("tr-TR")})`,
          type: data.docType ?? "Genel Belge",
          category: getCategoryForDocType(data.docType),
          content: data.document,
        });
      }
    } catch (e) {
      Alert.alert("Bir Sorun Oluştu", e instanceof Error ? e.message : "Bağlantı hatası");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const startChip = (chip: string) => {
    void handleSend(`${chip} hazırlamak istiyorum.`);
  };

  const getCategoryForDocType = (type: string | null): "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" => {
    if (!type) return "Hukuki";
    const t = type.toLowerCase();
    if (t.includes("kira") || t.includes("ihtar")) return "Hukuki";
    if (t.includes("istifa") || t.includes("izin")) return "İş Hayatı";
    if (t.includes("dondurma") || t.includes("öğrenci") || t.includes("okul")) return "Eğitim";
    return "Kişisel";
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: generatedDoc,
        title: `${docType ?? "Belge"} — EvrakAI`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={Colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Sparkles size={16} color={Colors.primaryForeground} />
          </LinearGradient>
          <View>
            <Text style={styles.logoTitle}>EvrakAI</Text>
            <Text style={styles.logoSubtitle}>Yapay zekâ destekli belge asistanı</Text>
          </View>
        </View>
        
        <View style={styles.quotaBadge}>
          <Zap size={12} color={Colors.primary} />
          <Text style={styles.quotaText}>{quota}/8</Text>
        </View>
      </View>

      {/* Messages & Chips */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick chips (show only initially) */}
          {messages.length <= 2 && (
            <View style={styles.chipsSection}>
              <Text style={styles.chipsLabel}>Popüler Belge Şablonları:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsScrollContent}
              >
                {QUICK_CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => startChip(chip)}
                    disabled={typing}
                    activeOpacity={0.7}
                    style={styles.chipButton}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Render Messages */}
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <View
                key={i}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowAssistant,
                ]}
              >
                {isUser ? (
                  <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.userBubble}
                  >
                    <Text style={styles.userText}>{m.content}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.assistantBubble}>
                    <Text style={styles.assistantText}>{m.content}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Typing Loading Indicator */}
          {typing && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={[styles.assistantBubble, styles.typingBubble]}>
                <PulsingDots />
              </View>
            </View>
          )}

          {/* Document Preview Trigger Widget */}
          {generatedDoc !== "" && (
            <TouchableOpacity
              onPress={() => setPreviewOpen(true)}
              activeOpacity={0.9}
              style={styles.previewWidget}
            >
              <LinearGradient
                colors={Colors.gradientPrimary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewIconContainer}
              >
                <FileText size={20} color={Colors.primaryForeground} />
              </LinearGradient>
              <View style={styles.previewWidgetText}>
                <Text style={styles.previewWidgetTitle}>{docType ?? "Belgeniz"} Hazır</Text>
                <Text style={styles.previewWidgetSubtitle}>Önizlemek ve paylaşmak için dokunun</Text>
              </View>
              <Eye size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <View style={styles.inputCard}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Belgenizi tek seferde anlatın ya da soruları yanıtlayın…"
              placeholderTextColor={Colors.mutedForeground}
              multiline
              maxHeight={100}
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => Alert.alert("Sesli Giriş", "Konuşarak belge hazırlamak için mikrofona basılı tutun. (Yakında aktif olacak)")}
              style={styles.iconButton}
            >
              <Mic size={18} color={Colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSend(input)}
              disabled={!input.trim() || typing}
              style={[
                styles.sendButton,
                (!input.trim() || typing) && styles.sendButtonDisabled,
              ]}
            >
              <Send size={14} color={Colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Preview Sheet Modal */}
      <DialogSheet
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`${docType ?? "Belge"} — Önizleme`}
        footer={
          <View style={styles.sheetButtons}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Başarılı", "Belge metni panoya kopyalandı!");
                setPreviewOpen(false);
              }}
              style={[styles.sheetBtn, styles.sheetBtnOutline]}
            >
              <Download size={16} color={Colors.foreground} />
              <Text style={styles.sheetBtnTextOutline}>Kopyala</Text>
            </TouchableOpacity>
            <GradientButton
              onPress={handleShare}
              title="Paylaş / İndir"
              style={styles.sheetBtnPrimary}
              icon={<Share2 size={16} color={Colors.primaryForeground} />}
            />
          </View>
        }
      >
        <View style={styles.sheetScrollWrapper}>
          <MarkdownView content={generatedDoc} />
          
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ Bu belge hukuki tavsiye yerine geçmez. Önemli resmi işlemleriniz için bir avukata danışmanız önemle tavsiye edilir.
            </Text>
          </View>
        </View>
      </DialogSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.foreground,
  },
  logoSubtitle: {
    fontSize: 10,
    color: Colors.mutedForeground,
  },
  quotaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quotaText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.foreground,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  chipsSection: {
    marginBottom: 8,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.mutedForeground,
    marginBottom: 8,
  },
  chipsScroll: {
    marginHorizontal: -16,
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    ...Shadows.sm,
  },
  chipText: {
    fontSize: 12,
    color: Colors.foreground,
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 2,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  userBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    ...Shadows.sm,
  },
  userText: {
    color: Colors.primaryForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  assistantBubble: {
    maxWidth: "85%",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    ...Shadows.sm,
  },
  assistantText: {
    color: Colors.foreground,
    fontSize: 13,
    lineHeight: 18,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  previewWidget: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    ...Shadows.md,
  },
  previewIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  previewWidgetText: {
    flex: 1,
  },
  previewWidgetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.foreground,
  },
  previewWidgetSubtitle: {
    fontSize: 10,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    ...Shadows.md,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.foreground,
    minHeight: 36,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    ...Shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    backgroundColor: Colors.mutedForeground,
  },
  // Sheet Dialog structure styles
  sheetScrollWrapper: {
    height: 400,
    gap: 12,
  },
  warningCard: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  warningText: {
    fontSize: 10,
    color: Colors.warningForeground,
    lineHeight: 14,
  },
  sheetButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetBtnTextOutline: {
    color: Colors.foreground,
    fontSize: 13,
    fontWeight: "600",
  },
  sheetBtnPrimary: {
    flex: 1.2,
  },
});
