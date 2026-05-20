import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Search,
  Star,
  FileText,
  Share2,
  Trash2,
  Download,
  Mail,
  Copy,
  ChevronRight,
  X,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { DialogSheet, GradientButton } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { exportToPDF, copyToClipboard, shareViaWhatsApp, shareViaEmail } from "../services/pdfExport";

const CATEGORIES = ["Tümü", "Hukuki", "İş Hayatı", "Eğitim", "Kişisel"] as const;

const CAT_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Hukuki:       { color: Colors.red,    bg: Colors.redLight,    emoji: "⚖️" },
  "İş Hayatı": { color: Colors.orange, bg: Colors.orangeLight, emoji: "💼" },
  Eğitim:       { color: Colors.blue,   bg: "#2563EB12",        emoji: "🎓" },
  Kişisel:      { color: Colors.green,  bg: Colors.greenLight,  emoji: "👤" },
  default:      { color: Colors.primary, bg: Colors.accentLight, emoji: "📄" },
};

export const DocumentsScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tümü");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useFocusEffect(useCallback(() => {
    StorageService.getDocuments().then(setDocuments);
  }, []));

  const toggleFavorite = async (id: string) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d));
    setDocuments(updated);
    await StorageService.saveDocuments(updated);
  };

  const deleteDocument = (id: string) => {
    Alert.alert("Belgeyi Sil", "Bu belge kalıcı olarak silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          const updated = documents.filter((d) => d.id !== id);
          setDocuments(updated);
          await StorageService.saveDocuments(updated);
          if (selectedDoc?.id === id) setSelectedDoc(null);
        },
      },
    ]);
  };

  const handleNativeShare = async (doc: Document) => {
    try { await Share.share({ message: doc.content, title: doc.title }); } catch {}
  };

  const handlePdfExport = (doc: Document) => {
    setSelectedDoc(null);
    setTimeout(() => exportToPDF(doc.content, doc.title), 300);
  };

  const handleCopy = async (doc: Document) => {
    const ok = await copyToClipboard(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (!ok) Alert.alert("Kopyalandı", "Belge panoya kopyalandı.");
  };

  const handleWhatsApp = (doc: Document) => { setShareOpen(false); shareViaWhatsApp(doc.content); };
  const handleEmail = (doc: Document) => { setShareOpen(false); shareViaEmail(doc.content, doc.title); };

  const filtered = documents.filter((d) => {
    const matchesCat = activeCategory === "Tümü" || d.category === activeCategory;
    const matchesQ =
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.type.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  const favorites = filtered.filter((d) => d.favorite);
  const rest = filtered.filter((d) => !d.favorite);

  type ListItem = Document | { _section: string };

  const listData: ListItem[] = [
    ...(favorites.length > 0 ? [{ _section: "⭐ Favoriler" } as ListItem, ...favorites] : []),
    ...(rest.length > 0
      ? [{ _section: favorites.length > 0 ? "Tüm Belgeler" : "Belgeler" } as ListItem, ...rest]
      : []),
  ];

  const renderDoc = ({ item }: { item: Document }) => {
    const cfg = CAT_CONFIG[item.category] ?? CAT_CONFIG.default;
    return (
      <TouchableOpacity
        onPress={() => setSelectedDoc(item)}
        activeOpacity={0.72}
        style={styles.docCard}
      >
        <View style={[styles.docIconWrap, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
        </View>
        <View style={styles.docBody}>
          <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.docMetaRow}>
            <View style={[styles.catDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.docMeta}>{item.category} · {item.date}</Text>
          </View>
        </View>
        <View style={styles.docRight}>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.starBtn}
          >
            <Star
              size={16}
              color={item.favorite ? Colors.yellow : Colors.labelTertiary}
              fill={item.favorite ? Colors.yellow : "transparent"}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
          <ChevronRight size={15} color={Colors.labelTertiary} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Belgelerim</Text>
          <Text style={styles.headerSub}>{documents.length} belge kaydedildi</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.labelTertiary} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Belge ara…"
            placeholderTextColor={Colors.labelTertiary}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearBtn}
            >
              <X size={12} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={{ flexGrow: 0 }}
        renderItem={({ item: c }) => {
          const active = activeCategory === c;
          const cfg = CAT_CONFIG[c];
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(c)}
              activeOpacity={0.7}
              style={[
                styles.catPill,
                active && { backgroundColor: cfg?.color ?? Colors.primary, borderColor: "transparent" },
              ]}
            >
              {cfg && <Text style={{ fontSize: 13 }}>{cfg.emoji} </Text>}
              <Text style={[styles.catText, active && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Document List */}
      <FlatList<ListItem>
        data={listData}
        keyExtractor={(item, i) => ("id" in item ? item.id : `s-${i}`)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>📂</Text>
            </View>
            <Text style={styles.emptyTitle}>Belge bulunamadı</Text>
            <Text style={styles.emptyDesc}>
              {query
                ? "Arama kriterlerine uyan belge yok."
                : "Sohbet sekmesinden ilk belgenizi oluşturun."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if ("_section" in item) {
            return <Text style={styles.sectionHeader}>{item._section}</Text>;
          }
          return renderDoc({ item });
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Detail Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.type}
          subtitle={`${selectedDoc.date} · ${selectedDoc.status}`}
          footer={
            <View style={styles.sheetFooterRow}>
              <TouchableOpacity
                onPress={() => deleteDocument(selectedDoc.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color={Colors.red} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePdfExport(selectedDoc)}
                style={styles.pdfBtn}
                activeOpacity={0.75}
              >
                <Download size={15} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.pdfBtnText}>PDF</Text>
              </TouchableOpacity>
              <GradientButton
                onPress={() => setShareOpen(true)}
                title="Paylaş"
                icon={<Share2 size={15} color="#fff" />}
                style={{ flex: 1 }}
              />
            </View>
          }
        >
          <MarkdownView content={selectedDoc.content} maxHeight={400} />
        </DialogSheet>
      )}

      {/* Share Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible={shareOpen}
          onClose={() => setShareOpen(false)}
          title="Belgeyi Paylaş"
          subtitle="Paylaşım yöntemini seçin"
        >
          <View style={styles.shareOptions}>
            {[
              { label: "WhatsApp", desc: "WhatsApp ile gönder", icon: "💬", bg: "#25D36615", onPress: () => handleWhatsApp(selectedDoc) },
              { label: "E-posta", desc: "E-posta uygulamasını aç", iconEl: <Mail size={22} color={Colors.blue} strokeWidth={1.5} />, bg: Colors.blue + "12", onPress: () => handleEmail(selectedDoc) },
              { label: copied ? "Kopyalandı! ✓" : "Panoya Kopyala", desc: "İstediğin yere yapıştır", iconEl: <Copy size={22} color={Colors.primary} strokeWidth={1.5} />, bg: Colors.accentLight, onPress: () => handleCopy(selectedDoc) },
              { label: "Diğer Uygulamalar", desc: "Sistem paylaşım menüsünü aç", iconEl: <Share2 size={22} color={Colors.labelSecondary} strokeWidth={1.5} />, bg: Colors.surface, onPress: () => { setShareOpen(false); handleNativeShare(selectedDoc); } },
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.label,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.labelTertiary,
    marginTop: 2,
    letterSpacing: -0.1,
  },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 44,
    ...Shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.label,
    letterSpacing: -0.2,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.labelTertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  catText: { fontSize: 13, fontWeight: "600", color: Colors.labelSecondary },
  catTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.labelTertiary,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 2,
  },

  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    ...Shadows.sm,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docBody: { flex: 1, gap: 4 },
  docTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.label,
    letterSpacing: -0.3,
  },
  docMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  catDot: { width: 5, height: 5, borderRadius: 2.5 },
  docMeta: { fontSize: 12, color: Colors.labelTertiary },
  docRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  starBtn: { padding: 2 },

  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.label, letterSpacing: -0.4 },
  emptyDesc: {
    fontSize: 14,
    color: Colors.labelTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  sheetFooterRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.red + "40",
    backgroundColor: Colors.redLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primaryMid,
    backgroundColor: Colors.accentLight,
  },
  pdfBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primary },

  shareOptions: { gap: 9 },
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
});
