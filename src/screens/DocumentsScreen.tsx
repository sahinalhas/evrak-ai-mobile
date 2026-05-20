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
  Share2,
  Trash2,
  ChevronRight,
  Download,
  Mail,
  Copy,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { DialogSheet, GradientButton } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { exportToPDF, copyToClipboard, shareViaWhatsApp, shareViaEmail } from "../services/pdfExport";

type Category = "Tümü" | "Hukuki" | "İş Hayatı" | "Eğitim" | "Vatandaşlık" | "Kişisel";
const CATEGORIES: Category[] = ["Tümü", "Hukuki", "İş Hayatı", "Eğitim", "Vatandaşlık", "Kişisel"];

const CAT_ACCENT: Record<string, string> = {
  Hukuki: "#E53935",
  "İş Hayatı": "#F57C00",
  Eğitim: "#1E88E5",
  Vatandaşlık: "#7B1FA2",
  Kişisel: "#2E7D32",
  default: Colors.accent,
};

const CAT_EMOJI: Record<string, string> = {
  Hukuki: "⚖️",
  "İş Hayatı": "💼",
  Eğitim: "🎓",
  Vatandaşlık: "🏛️",
  Kişisel: "👤",
};

const CAT_ORDER: Category[] = ["Hukuki", "İş Hayatı", "Eğitim", "Vatandaşlık", "Kişisel"];

export const DocumentsScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("Tümü");
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
    setTimeout(() => setCopied(false), 2200);
    if (!ok) Alert.alert("Kopyalandı", "Belge panoya kopyalandı.");
  };

  const handleWhatsApp = (doc: Document) => {
    setShareOpen(false);
    shareViaWhatsApp(doc.content);
  };

  const handleEmail = (doc: Document) => {
    setShareOpen(false);
    shareViaEmail(doc.content, doc.title);
  };

  const countByCategory = (cat: string) =>
    documents.filter((d) => d.category === cat).length;

  const searchFiltered = documents.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.type.toLowerCase().includes(query.toLowerCase())
  );

  const filtered = activeCategory === "Tümü"
    ? searchFiltered
    : searchFiltered.filter((d) => d.category === activeCategory);

  type ListItem = Document | { _section: string; _accent?: string };

  const buildListData = (): ListItem[] => {
    if (activeCategory !== "Tümü" || query.length > 0) {
      const favs = filtered.filter((d) => d.favorite);
      const rest = filtered.filter((d) => !d.favorite);
      return [
        ...(favs.length > 0 ? [{ _section: "Favoriler" } as ListItem, ...favs] : []),
        ...(rest.length > 0 ? [{ _section: favs.length > 0 ? "Belgeler" : "Tüm Belgeler" } as ListItem, ...rest] : []),
      ];
    }
    const result: ListItem[] = [];
    const favs = filtered.filter((d) => d.favorite);
    if (favs.length > 0) {
      result.push({ _section: "Favoriler" });
      result.push(...favs);
    }
    CAT_ORDER.forEach((cat) => {
      const catDocs = filtered.filter((d) => d.category === cat && !d.favorite);
      if (catDocs.length > 0) {
        result.push({ _section: cat, _accent: CAT_ACCENT[cat] });
        result.push(...catDocs);
      }
    });
    return result;
  };

  const listData = buildListData();

  const renderDoc = ({ item }: { item: Document }) => {
    const accent = CAT_ACCENT[item.category] ?? CAT_ACCENT.default;
    const emoji = CAT_EMOJI[item.category] ?? "📄";
    return (
      <TouchableOpacity onPress={() => setSelectedDoc(item)} activeOpacity={0.75} style={styles.docRow}>
        <View style={[styles.docIcon, { backgroundColor: accent + "15" }]}>
          <Text style={{ fontSize: 17 }}>{emoji}</Text>
        </View>
        <View style={styles.docBody}>
          <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.docMeta}>{item.date} · {item.status}</Text>
        </View>
        <View style={styles.docRight}>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Star
              size={16}
              color={item.favorite ? "#FBBF24" : Colors.mutedForeground}
              fill={item.favorite ? "#FBBF24" : "transparent"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <ChevronRight size={15} color={Colors.mutedForeground} strokeWidth={1.5} />
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
          <Text style={styles.headerSub}>{documents.length} belge kayıtlı</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.mutedForeground} strokeWidth={1.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Belge ara..."
            placeholderTextColor={Colors.mutedForeground}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <View style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Pills — with counts */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={{ flexGrow: 0 }}
        renderItem={({ item: c }) => {
          const active = activeCategory === c;
          const accent = c === "Tümü" ? Colors.accent : (CAT_ACCENT[c] ?? Colors.accent);
          const count = c === "Tümü" ? documents.length : countByCategory(c);
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(c)}
              activeOpacity={0.7}
              style={[
                styles.catPill,
                active && { backgroundColor: accent, borderColor: accent },
              ]}
            >
              {c !== "Tümü" && <Text style={styles.catPillEmoji}>{CAT_EMOJI[c]}</Text>}
              <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{c}</Text>
              {count > 0 && (
                <View style={[styles.catBadge, active ? styles.catBadgeActive : { backgroundColor: accent + "20" }]}>
                  <Text style={[styles.catBadgeText, active ? styles.catBadgeTextActive : { color: accent }]}>
                    {count}
                  </Text>
                </View>
              )}
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
            <Text style={styles.emptyIcon}>📂</Text>
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
            const accent = item._accent;
            return (
              <View style={styles.sectionRow}>
                {accent
                  ? <View style={[styles.sectionDot, { backgroundColor: accent }]} />
                  : <Text style={styles.sectionStar}>★</Text>
                }
                <Text style={[styles.sectionLabel, accent ? { color: accent } : { color: "#FBBF24" }]}>
                  {item._section}
                </Text>
              </View>
            );
          }
          return renderDoc({ item });
        }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />

      {/* Detail Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          subtitle={`${selectedDoc.type} · ${selectedDoc.date}`}
          footer={
            <View style={styles.sheetFooter}>
              <TouchableOpacity onPress={() => deleteDocument(selectedDoc.id)} style={styles.deleteBtn}>
                <Trash2 size={16} color={Colors.red} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePdfExport(selectedDoc)}
                style={styles.pdfBtn}
                activeOpacity={0.75}
              >
                <Download size={15} color={Colors.accent} strokeWidth={1.8} />
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
          <MarkdownView content={selectedDoc.content} maxHeight={380} />
        </DialogSheet>
      )}

      {/* Share Options Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible={shareOpen}
          onClose={() => setShareOpen(false)}
          title="Belgeyi Paylaş"
          subtitle="Paylaşım yöntemini seçin"
        >
          <View style={styles.shareOptions}>
            <TouchableOpacity onPress={() => handleWhatsApp(selectedDoc)} style={styles.shareOption} activeOpacity={0.75}>
              <View style={[styles.shareIcon, { backgroundColor: "#25D36620" }]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>WhatsApp</Text>
                <Text style={styles.shareOptionDesc}>WhatsApp üzerinden gönder</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleEmail(selectedDoc)} style={styles.shareOption} activeOpacity={0.75}>
              <View style={[styles.shareIcon, { backgroundColor: Colors.blue + "20" }]}>
                <Mail size={22} color={Colors.blue} strokeWidth={1.5} />
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>E-posta</Text>
                <Text style={styles.shareOptionDesc}>E-posta uygulamasını aç</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleCopy(selectedDoc)} style={styles.shareOption} activeOpacity={0.75}>
              <View style={[styles.shareIcon, { backgroundColor: Colors.accentLight }]}>
                <Copy size={22} color={Colors.accent} strokeWidth={1.5} />
              </View>
              <View style={styles.shareOptionText}>
                <Text style={styles.shareOptionTitle}>{copied ? "Kopyalandı! ✓" : "Panoya Kopyala"}</Text>
                <Text style={styles.shareOptionDesc}>Metni kopyala, istediğin yere yapıştır</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setShareOpen(false); handleNativeShare(selectedDoc); }}
              style={styles.shareOption}
              activeOpacity={0.75}
            >
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.label,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 2,
  },

  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separatorOpaque,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    ...Shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.label, letterSpacing: -0.2 },
  clearBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.mutedForeground,
    alignItems: "center", justifyContent: "center",
  },
  clearBtnText: { fontSize: 8, color: "#fff", fontWeight: "700" },

  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separatorOpaque,
    ...Shadows.xs,
  },
  catPillEmoji: { fontSize: 13 },
  catPillText: { fontSize: 13, color: Colors.label, fontWeight: "500" },
  catPillTextActive: { color: "#fff", fontWeight: "600" },
  catBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5,
  },
  catBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  catBadgeText: { fontSize: 11, fontWeight: "700" },
  catBadgeTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 2,
  },
  sectionDot: { width: 7, height: 7, borderRadius: 4 },
  sectionStar: { fontSize: 11, color: "#FBBF24" },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 12,
    ...Shadows.xs,
  },
  docIcon: {
    width: 42, height: 42, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  docBody: { flex: 1, gap: 3 },
  docTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  docMeta: { fontSize: 12, color: Colors.mutedForeground },
  docRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.label },
  emptyDesc: {
    fontSize: 14, color: Colors.mutedForeground,
    textAlign: "center", paddingHorizontal: 40, lineHeight: 20,
  },

  sheetFooter: { flexDirection: "row", gap: 10, alignItems: "center" },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.red + "50",
    backgroundColor: Colors.red + "10",
    alignItems: "center", justifyContent: "center",
  },
  pdfBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, height: 44,
    borderRadius: 12, borderWidth: 1,
    borderColor: Colors.accentMid,
    backgroundColor: Colors.accentLight,
  },
  pdfBtnText: { fontSize: 13, fontWeight: "600", color: Colors.accent },

  shareOptions: { gap: 8 },
  shareOption: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
    borderRadius: 14, backgroundColor: Colors.background,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  shareIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  shareOptionText: { flex: 1 },
  shareOptionTitle: { fontSize: 15, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  shareOptionDesc: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
});
