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
import { StatusBar } from "expo-status-bar";
import {
  Send,
  FileText,
  Eye,
  Share2,
  Plus,
  RotateCcw,
  Sparkles,
  Download,
  Mail,
  Copy,
  MessageCircle,
  ShoppingCart,
  Check,
} from "lucide-react-native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { AIService, ChatMsg } from "../services/ai";
import { GradientButton, DialogSheet, PulsingDots } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { exportToPDF, copyToClipboard, shareViaWhatsApp, shareViaEmail } from "../services/pdfExport";

const QUICK_CHIPS = [
  { label: "Dilekçe", emoji: "📄" },
  { label: "İzin Talebi", emoji: "🗓️" },
  { label: "İstifa Dilekçesi", emoji: "💼" },
  { label: "İş Başvuru Yazısı", emoji: "📝" },
  { label: "Kayıt Dondurma", emoji: "🎓" },
  { label: "Şikayet Dilekçesi", emoji: "📢" },
  { label: "Taahhütname", emoji: "🖊️" },
  { label: "Referans Mektubu", emoji: "⭐" },
  { label: "Nakil Talebi", emoji: "🏫" },
  { label: "Not İtirazı", emoji: "📊" },
  { label: "Bilgi Edinme", emoji: "🔍" },
  { label: "SGK Belgesi", emoji: "🏛️" },
];

const GREETING = "Merhaba! Bugün hangi belgeyi oluşturmak istersiniz?\n\nTüm bilgileri tek seferde anlatabilirsiniz, eksik varsa ben sorarım.";
const MAX_SESSION_MSGS = 15;

const CREDIT_PACKAGES = [
  { id: "p1", label: "1 Belge", credits: 1, price: "₺29", priceNum: 29, badge: null },
  { id: "p3", label: "3 Belge Paketi", credits: 3, price: "₺59", priceNum: 59, badge: "Popüler" },
  { id: "p10", label: "10 Belge Paketi", credits: 10, price: "₺129", priceNum: 129, badge: "En İyi Değer" },
];

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [docType, setDocType] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [sessionMsgCount, setSessionMsgCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string>("p3");
  const listRef = useRef<FlatList>(null);
  const docCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { StorageService.getCredits().then(setCredits); }, []);

  const scrollToBottom = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const showDocCard = () => {
    docCardAnim.setValue(0);
    Animated.spring(docCardAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }).start();
  };

  const handleNewChat = () => {
    Alert.alert("Yeni Sohbet", "Mevcut sohbet silinecek, yeni bir belge oluşturabilirsiniz.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Yeni Başlat", onPress: () => {
          setMessages([{ role: "assistant", content: GREETING }]);
          setInput("");
          setDocType(null);
          setGeneratedDoc("");
          setSessionMsgCount(0);
        }
      },
    ]);
  };

  const sessionLimitReached = sessionMsgCount >= MAX_SESSION_MSGS;

  const handleSend = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;

    // Session message limit check
    if (sessionLimitReached) return;

    // Credit check — only block if no credits AND no doc generated yet in this session
    if (credits <= 0) {
      setBuyOpen(true);
      return;
    }

    const nextCount = sessionMsgCount + 1;
    setSessionMsgCount(nextCount);

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

        // Consume 1 credit when document is actually generated
        const ok = await StorageService.useCredit();
        if (ok) {
          const remaining = await StorageService.getCredits();
          setCredits(remaining);
        }

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

  const handleBuyCredits = async () => {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === selectedPkg)!;
    // Simulate purchase — in production, integrate real payment here
    const next = await StorageService.addCredits(pkg.credits);
    setCredits(next);
    setBuyOpen(false);
    Alert.alert(
      "Çok Yakında",
      `Uygulama içi satın alma özelliği çok yakında aktif olacak. ${pkg.credits} deneme kredisi hesabınıza eklendi.`,
    );
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
    try { await Share.share({ message: generatedDoc, title: `${docType ?? "Belge"} — EvrakAI` }); } catch { }
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

  const creditColor = credits === 0 ? Colors.red : credits <= 2 ? Colors.orange : Colors.accent;
  const sessionMsgsLeft = MAX_SESSION_MSGS - sessionMsgCount;
  const showSessionWarn = sessionMsgCount >= 10 && !sessionLimitReached;

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
          <Text style={styles.headerTitle}>EvrakAI</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Credit badge */}
          <TouchableOpacity
            onPress={() => setBuyOpen(true)}
            activeOpacity={0.75}
            style={[styles.creditBadge, { borderColor: creditColor + "50" }]}
          >
            <View style={[styles.creditDot, { backgroundColor: creditColor }]} />
            <Text style={[styles.creditText, { color: creditColor }]}>
              {credits} kredi
            </Text>
            {credits === 0 && (
              <ShoppingCart size={11} color={creditColor} strokeWidth={2} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
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

        {/* Session limit reached wall */}
        {sessionLimitReached ? (
          <View style={styles.limitWall}>
            <View style={styles.limitWallInner}>
              <Text style={styles.limitWallEmoji}>⏱️</Text>
              <Text style={styles.limitWallTitle}>Mesaj Hakkınız Doldu</Text>
              <Text style={styles.limitWallDesc}>
                Bu belgede {MAX_SESSION_MSGS} mesaj hakkınızı kullandınız.{"\n"}
                Yeni belge oluşturmak için yeni sohbet başlatın.
              </Text>
              <TouchableOpacity onPress={handleNewChat} style={styles.limitWallBtn} activeOpacity={0.8}>
                <Plus size={14} color="#fff" strokeWidth={2} />
                <Text style={styles.limitWallBtnText}>Yeni Sohbet Başlat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputArea}>
            {/* Session warn */}
            {showSessionWarn && (
              <View style={styles.sessionWarnBar}>
                <MessageCircle size={12} color={Colors.orange} strokeWidth={2} />
                <Text style={styles.sessionWarnText}>
                  {sessionMsgsLeft} mesaj hakkınız kaldı
                </Text>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Belgenizi anlatın…"
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
            <Text style={styles.disclaimer}>EvrakAI hukuki tavsiye niteliği taşımaz. Önemli işlemler için avukata danışın.</Text>
          </View>
        )}
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
                  <View style={styles.pkgRadio}>
                    {isSelected && <View style={styles.pkgRadioFill} />}
                  </View>
                  <View>
                    <View style={styles.pkgTitleRow}>
                      <Text style={[styles.pkgLabel, isSelected && styles.pkgLabelSelected]}>
                        {pkg.label}
                      </Text>
                      {pkg.badge && (
                        <View style={[styles.pkgBadge, pkg.id === "p10" && styles.pkgBadgeGreen]}>
                          <Text style={styles.pkgBadgeText}>{pkg.badge}</Text>
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
  creditBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, backgroundColor: Colors.background,
  },
  creditDot: { width: 6, height: 6, borderRadius: 3 },
  creditText: { fontSize: 12, fontWeight: "600" },
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

  // Session limit wall
  limitWall: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator,
  },
  limitWallInner: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1, borderColor: Colors.orange + "40",
    padding: 18, alignItems: "center", gap: 6,
  },
  limitWallEmoji: { fontSize: 28, marginBottom: 4 },
  limitWallTitle: { fontSize: 16, fontWeight: "700", color: Colors.label, letterSpacing: -0.3 },
  limitWallDesc: { fontSize: 13, color: Colors.mutedForeground, textAlign: "center", lineHeight: 19 },
  limitWallBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 11, marginTop: 8,
  },
  limitWallBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  // Input
  sessionWarnBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.orange + "15",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    marginBottom: 8,
  },
  sessionWarnText: { fontSize: 12, color: Colors.orange, flex: 1 },
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

  // Credit packages
  pkgList: { gap: 10 },
  pkgCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  pkgCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  pkgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pkgRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.separator,
    alignItems: "center", justifyContent: "center",
  },
  pkgRadioFill: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  pkgTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  pkgLabel: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  pkgLabelSelected: { color: Colors.accent },
  pkgBadge: {
    backgroundColor: Colors.accent + "20",
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  pkgBadgeGreen: { backgroundColor: Colors.green + "20" },
  pkgBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.accent },
  pkgSub: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  pkgPrice: { fontSize: 18, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  pkgPriceSelected: { color: Colors.accent },
  pkgNote: {
    backgroundColor: Colors.muted, borderRadius: 10, padding: 12, marginTop: 4,
  },
  pkgNoteText: { fontSize: 12, color: Colors.mutedForeground, lineHeight: 17 },
});
