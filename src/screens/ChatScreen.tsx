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
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService } from "../services/storage";
import { AIService, ChatMsg } from "../services/ai";
import { GradientButton, DialogSheet, PulsingDots } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { exportToPDF, copyToClipboard, shareViaWhatsApp, shareViaEmail } from "../services/pdfExport";

const QUICK_CHIPS = [
  { label: "Dilekçe", emoji: "📄", color: "#3B3FD8" },
  { label: "İzin Talebi", emoji: "🗓️", color: "#059669" },
  { label: "İstifa Dilekçesi", emoji: "💼", color: "#DC2626" },
  { label: "İş Başvurusu", emoji: "📝", color: "#D97706" },
  { label: "Kayıt Dondurma", emoji: "🎓", color: "#7C3AED" },
  { label: "Şikayet Dilekçesi", emoji: "📢", color: "#DB2777" },
  { label: "Taahhütname", emoji: "🖊️", color: "#0891B2" },
  { label: "Referans Mektubu", emoji: "⭐", color: "#D97706" },
  { label: "Nakil Talebi", emoji: "🏫", color: "#059669" },
  { label: "Not İtirazı", emoji: "📊", color: "#3B3FD8" },
  { label: "Bilgi Edinme", emoji: "🔍", color: "#7C3AED" },
  { label: "SGK Belgesi", emoji: "🏛️", color: "#0891B2" },
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
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { StorageService.getCredits().then(setCredits); }, []);

  const scrollToBottom = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const showDocCard = () => {
    docCardAnim.setValue(0);
    Animated.spring(docCardAnim, { toValue: 1, tension: 60, friction: 11, useNativeDriver: true }).start();
  };

  const handleInputFocus = (focused: boolean) => {
    Animated.timing(inputFocusAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleNewChat = () => {
    Alert.alert("Yeni Sohbet", "Mevcut sohbet silinecek. Yeni belge oluşturabilirsiniz.", [
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
    if (!text || typing || sessionLimitReached) return;

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
    const next = await StorageService.addCredits(pkg.credits);
    setCredits(next);
    setBuyOpen(false);
    Alert.alert("Çok Yakında", `Uygulama içi satın alma özelliği çok yakında aktif olacak. ${pkg.credits} deneme kredisi hesabınıza eklendi.`);
  };

  const getCat = (type: string | null): "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" => {
    if (!type) return "Hukuki";
    const t = type.toLowerCase();
    if (t.includes("kira") || t.includes("ihtar") || t.includes("vekalet") || t.includes("şikayet")) return "Hukuki";
    if (t.includes("istifa") || t.includes("izin") || t.includes("iş sözleşmesi") || t.includes("taahhüt")) return "İş Hayatı";
    if (t.includes("dondurma") || t.includes("öğrenci") || t.includes("nakil") || t.includes("not")) return "Eğitim";
    return "Kişisel";
  };

  const handleNativeShare = async () => {
    try { await Share.share({ message: generatedDoc, title: `${docType ?? "Belge"} — EvrakAI` }); } catch { }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (!ok) Alert.alert("Kopyalandı", "Belge panoya kopyalandı.");
  };

  const handlePdfExport = () => {
    setPreviewOpen(false);
    setTimeout(() => exportToPDF(generatedDoc, docType ?? "Belge"), 300);
  };

  const handleWhatsApp = () => { setShareOpen(false); shareViaWhatsApp(generatedDoc); };
  const handleEmail = () => { setShareOpen(false); shareViaEmail(generatedDoc, `${docType ?? "Belge"} — EvrakAI`); };

  const creditLow = credits <= 2;
  const creditOut = credits === 0;
  const creditColor = creditOut ? Colors.red : creditLow ? Colors.orange : Colors.green;
  const sessionMsgsLeft = MAX_SESSION_MSGS - sessionMsgCount;
  const showSessionWarn = sessionMsgCount >= 10 && !sessionLimitReached;

  const borderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.separator, Colors.primary],
  });

  const renderMessage = ({ item, index }: { item: ChatMsg; index: number }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Sparkles size={11} color="#fff" strokeWidth={2} />
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
            <Text style={styles.headerSub}>Belge Asistanı</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setBuyOpen(true)}
            activeOpacity={0.75}
            style={[styles.creditPill, { backgroundColor: creditColor + "15", borderColor: creditColor + "40" }]}
          >
            <View style={[styles.creditDot, { backgroundColor: creditColor }]} />
            <Text style={[styles.creditText, { color: creditColor }]}>
              {credits} kredi
            </Text>
            {creditOut && <ShoppingCart size={11} color={creditColor} strokeWidth={2} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNewChat}
            style={styles.newChatBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
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
              <View style={styles.templateSection}>
                <View style={styles.templateHeader}>
                  <Zap size={14} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.templateLabel}>Sık kullanılan belgeler</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {QUICK_CHIPS.map((c) => (
                    <TouchableOpacity
                      key={c.label}
                      onPress={() => handleSend(`${c.label} hazırlamak istiyorum.`)}
                      disabled={typing}
                      activeOpacity={0.7}
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
                    <Sparkles size={11} color="#fff" strokeWidth={2} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAI]}>
                    <PulsingDots />
                  </View>
                </View>
              )}
              {generatedDoc !== "" && (
                <Animated.View
                  style={{
                    opacity: docCardAnim,
                    transform: [
                      { scale: docCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                      { translateY: docCardAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                    ],
                    marginTop: 12,
                  }}
                >
                  <View style={styles.docCard}>
                    <TouchableOpacity
                      onPress={() => setPreviewOpen(true)}
                      activeOpacity={0.8}
                      style={styles.docCardMain}
                    >
                      <View style={styles.docCardIconWrap}>
                        <FileText size={20} color={Colors.primary} strokeWidth={1.5} />
                      </View>
                      <View style={styles.docCardBody}>
                        <Text style={styles.docCardTitle}>{docType ?? "Belge"} hazırlandı ✓</Text>
                        <Text style={styles.docCardSub}>Önizlemek için dokunun</Text>
                      </View>
                      <Eye size={16} color={Colors.primary} strokeWidth={1.8} />
                    </TouchableOpacity>
                    <View style={styles.docCardActions}>
                      <TouchableOpacity onPress={handlePdfExport} style={styles.docAction} activeOpacity={0.7}>
                        <Download size={15} color={Colors.primary} strokeWidth={2} />
                        <Text style={styles.docActionText}>PDF</Text>
                      </TouchableOpacity>
                      <View style={styles.docActionDivider} />
                      <TouchableOpacity onPress={() => setShareOpen(true)} style={styles.docAction} activeOpacity={0.7}>
                        <Share2 size={15} color={Colors.primary} strokeWidth={2} />
                        <Text style={styles.docActionText}>Paylaş</Text>
                      </TouchableOpacity>
                      <View style={styles.docActionDivider} />
                      <TouchableOpacity onPress={handleCopy} style={styles.docAction} activeOpacity={0.7}>
                        <Copy size={15} color={copied ? Colors.green : Colors.primary} strokeWidth={2} />
                        <Text style={[styles.docActionText, copied && { color: Colors.green }]}>
                          {copied ? "Kopyalandı!" : "Kopyala"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              )}
              <View style={{ height: 20 }} />
            </>
          }
        />

        {/* Session limit wall */}
        {sessionLimitReached ? (
          <View style={styles.limitWall}>
            <View style={styles.limitWallInner}>
              <Text style={styles.limitWallEmoji}>⏱</Text>
              <Text style={styles.limitWallTitle}>Sohbet Limiti Doldu</Text>
              <Text style={styles.limitWallDesc}>
                Bu belgede {MAX_SESSION_MSGS} mesaj kullandınız.{"\n"}
                Yeni belge için yeni bir sohbet başlatın.
              </Text>
              <TouchableOpacity onPress={handleNewChat} style={styles.limitBtn} activeOpacity={0.8}>
                <Plus size={15} color="#fff" strokeWidth={2.5} />
                <Text style={styles.limitBtnText}>Yeni Sohbet Başlat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputArea}>
            {showSessionWarn && (
              <View style={styles.sessionWarnBar}>
                <MessageCircle size={12} color={Colors.orange} strokeWidth={2} />
                <Text style={styles.sessionWarnText}>{sessionMsgsLeft} mesaj hakkınız kaldı</Text>
              </View>
            )}
            <Animated.View style={[styles.inputRow, { borderColor }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Belgenizi anlatın…"
                placeholderTextColor={Colors.labelTertiary}
                multiline
                maxLength={600}
                style={styles.textInput}
                onFocus={() => handleInputFocus(true)}
                onBlur={() => handleInputFocus(false)}
              />
              <TouchableOpacity
                onPress={() => handleSend(input)}
                disabled={!input.trim() || typing}
                style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
                activeOpacity={0.8}
              >
                {typing
                  ? <RotateCcw size={16} color="#fff" strokeWidth={2.5} />
                  : <Send size={16} color="#fff" strokeWidth={2.5} />}
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.disclaimer}>
              EvrakAI hukuki tavsiye niteliği taşımaz. Önemli işlemler için avukata danışın.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Preview Sheet */}
      <DialogSheet
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={docType ?? "Belge Önizleme"}
        subtitle="İnceleyip paylaşabilirsiniz"
        footer={
          <View style={styles.sheetFooterRow}>
            <TouchableOpacity onPress={handlePdfExport} style={styles.pdfBtn} activeOpacity={0.75}>
              <Download size={16} color={Colors.primary} strokeWidth={2} />
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
        <MarkdownView content={generatedDoc} maxHeight={400} />
      </DialogSheet>

      {/* Share Sheet */}
      <DialogSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Belgeyi Paylaş"
        subtitle="Paylaşım yöntemini seçin"
      >
        <View style={styles.shareOptions}>
          {[
            { label: "WhatsApp", desc: "WhatsApp ile gönder", icon: "💬", bg: "#25D36615", onPress: handleWhatsApp },
            { label: "E-posta", desc: "E-posta uygulamasını aç", iconEl: <Mail size={22} color={Colors.blue} strokeWidth={1.5} />, bg: Colors.blue + "12", onPress: handleEmail },
            { label: copied ? "Kopyalandı! ✓" : "Panoya Kopyala", desc: "Metni kopyala, istediğin yere yapıştır", iconEl: <Copy size={22} color={Colors.primary} strokeWidth={1.5} />, bg: Colors.accentLight, onPress: handleCopy },
            { label: "Diğer Uygulamalar", desc: "Sistem paylaşım menüsünü aç", iconEl: <Share2 size={22} color={Colors.labelSecondary} strokeWidth={1.5} />, bg: Colors.surface, onPress: () => { setShareOpen(false); handleNativeShare(); } },
          ].map((opt, i) => (
            <TouchableOpacity key={i} onPress={opt.onPress} style={styles.shareOption} activeOpacity={0.75}>
              <View style={[styles.shareIconBox, { backgroundColor: opt.bg }]}>
                {opt.icon ? <Text style={{ fontSize: 22 }}>{opt.icon}</Text> : opt.iconEl}
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>{opt.label}</Text>
                <Text style={styles.shareOptionDesc}>{opt.desc}</Text>
              </View>
              <ChevronRight size={14} color={Colors.labelTertiary} strokeWidth={2} />
            </TouchableOpacity>
          ))}
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
            title={`Satın Al — ${CREDIT_PACKAGES.find(p => p.id === selectedPkg)?.price}`}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
    ...Shadows.xs,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  logoGlyph: { fontSize: 17, color: "#fff" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.label, letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: Colors.labelTertiary, letterSpacing: -0.1, marginTop: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  creditPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditDot: { width: 6, height: 6, borderRadius: 3 },
  creditText: { fontSize: 12, fontWeight: "700", letterSpacing: -0.1 },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Chat
  chatContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10, gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
    ...Shadows.sm,
  },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    ...Shadows.xs,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: "#fff", letterSpacing: -0.2 },
  bubbleTextAI: { color: Colors.label, letterSpacing: -0.2 },

  // Template chips
  templateSection: { marginBottom: 20 },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.labelSecondary,
    letterSpacing: -0.1,
  },
  chipsRow: { gap: 8, paddingHorizontal: 2, paddingBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.separator,
    ...Shadows.xs,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },

  // Document card
  docCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primaryMid,
    overflow: "hidden",
    ...Shadows.md,
  },
  docCardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.accentLight,
  },
  docCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.xs,
  },
  docCardBody: { flex: 1 },
  docCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  docCardSub: { fontSize: 12, color: Colors.primary, opacity: 0.7, marginTop: 2 },
  docCardActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.primaryMid,
    backgroundColor: Colors.card,
  },
  docAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  docActionDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginVertical: 8 },
  docActionText: { fontSize: 13, fontWeight: "600", color: Colors.primary, letterSpacing: -0.2 },

  // Limit wall
  limitWall: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    backgroundColor: Colors.card,
  },
  limitWallInner: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    gap: 8,
  },
  limitWallEmoji: { fontSize: 32, marginBottom: 4 },
  limitWallTitle: { fontSize: 17, fontWeight: "700", color: Colors.label, letterSpacing: -0.4 },
  limitWallDesc: { fontSize: 14, color: Colors.labelSecondary, textAlign: "center", lineHeight: 20, letterSpacing: -0.1 },
  limitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 8,
    ...Shadows.glow,
  },
  limitBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", letterSpacing: -0.2 },

  // Input area
  inputArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    gap: 8,
  },
  sessionWarnBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.orangeLight,
    borderRadius: 8,
  },
  sessionWarnText: { fontSize: 12, color: Colors.orange, fontWeight: "600", letterSpacing: -0.1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.label,
    maxHeight: 110,
    letterSpacing: -0.2,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...Shadows.glow,
  },
  sendBtnDisabled: { backgroundColor: Colors.separatorOpaque, shadowOpacity: 0 },
  disclaimer: {
    fontSize: 11,
    color: Colors.labelTertiary,
    textAlign: "center",
    letterSpacing: -0.1,
  },

  // Sheet footer
  sheetFooterRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryMid,
    backgroundColor: Colors.accentLight,
  },
  pdfBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primary },

  // Share
  shareOptions: { gap: 8 },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  shareIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  shareOptionText: { flex: 1 },
  shareOptionTitle: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.3 },
  shareOptionDesc: { fontSize: 12, color: Colors.labelTertiary, marginTop: 2 },

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
  pkgCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
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
  pkgTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  pkgLabel: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.3 },
  pkgLabelActive: { color: Colors.primary },
  pkgSub: { fontSize: 12, color: Colors.labelTertiary, marginTop: 2 },
  pkgPrice: { fontSize: 17, fontWeight: "800", color: Colors.label, letterSpacing: -0.4 },
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
  pkgNoteText: { fontSize: 13, color: Colors.labelSecondary, lineHeight: 18, letterSpacing: -0.1 },
});
