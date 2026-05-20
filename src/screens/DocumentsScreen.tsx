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
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { DialogSheet, GradientButton } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";

const CATEGORIES = ["Tümü", "Hukuki", "İş Hayatı", "Eğitim", "Kişisel"] as const;

const CAT_ACCENT: Record<string, string> = {
  Hukuki: Colors.red,
  "İş Hayatı": Colors.orange,
  Eğitim: Colors.blue,
  Kişisel: Colors.green,
  default: Colors.accent,
};

const CAT_EMOJI: Record<string, string> = {
  Hukuki: "⚖️",
  "İş Hayatı": "💼",
  Eğitim: "🎓",
  Kişisel: "👤",
};

export const DocumentsScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tümü");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

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
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          const updated = documents.filter((d) => d.id !== id);
          setDocuments(updated);
          await StorageService.saveDocuments(updated);
          if (selectedDoc?.id === id) setSelectedDoc(null);
        },
      },
    ]);
  };

  const handleShare = async (doc: Document) => {
    try { await Share.share({ message: doc.content, title: doc.title }); } catch {}
  };

  const filtered = documents.filter((d) => {
    const matchesCat = activeCategory === "Tümü" || d.category === activeCategory;
    const matchesQ =
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.type.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  const favorites = filtered.filter((d) => d.favorite);
  const rest = filtered.filter((d) => !d.favorite);

  const renderDoc = ({ item }: { item: Document }) => {
    const accent = CAT_ACCENT[item.category] ?? CAT_ACCENT.default;
    const emoji = CAT_EMOJI[item.category] ?? "📄";
    return (
      <TouchableOpacity onPress={() => setSelectedDoc(item)} activeOpacity={0.7} style={styles.docRow}>
        <View style={[styles.docEmoji, { backgroundColor: accent + "15" }]}>
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
        <View style={styles.docBody}>
          <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.docMeta}>{item.date} · {item.status}</Text>
        </View>
        <View style={styles.docRight}>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Star
              size={15}
              color={item.favorite ? Colors.yellow : Colors.mutedForeground}
              fill={item.favorite ? Colors.yellow : "transparent"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <ChevronRight size={14} color={Colors.mutedForeground} strokeWidth={1.5} />
        </View>
      </TouchableOpacity>
    );
  };

  type ListItem = Document | { _section: string };

  const listData: ListItem[] = [
    ...(favorites.length > 0 ? [{ _section: "Favoriler" } as ListItem, ...favorites] : []),
    ...(rest.length > 0 ? [{ _section: favorites.length > 0 ? "Belgeler" : "Tüm Belgeler" } as ListItem, ...rest] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Belgelerim</Text>
        <Text style={styles.headerCount}>{documents.length} belge</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.mutedForeground} strokeWidth={1.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Arama"
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

      {/* Category Tabs */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={{ flexGrow: 0 }}
        renderItem={({ item: c }) => {
          const active = activeCategory === c;
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(c)}
              activeOpacity={0.7}
              style={[styles.catPill, active && styles.catPillActive]}
            >
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
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Belge bulunamadı</Text>
            <Text style={styles.emptyDesc}>
              {query ? "Arama kriterlerine uyan belge yok." : "Sohbet sekmesinden ilk belgenizi oluşturun."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if ("_section" in item) {
            return <Text style={styles.sectionHeader}>{item._section}</Text>;
          }
          return renderDoc({ item });
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
              <GradientButton
                onPress={() => handleShare(selectedDoc)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.5 },
  headerCount: { fontSize: 14, color: Colors.mutedForeground },

  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separatorOpaque,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    ...Shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.label, letterSpacing: -0.2 },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.mutedForeground,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { fontSize: 8, color: "#fff", fontWeight: "700" },

  catRow: { paddingHorizontal: 16, gap: 7, paddingBottom: 12 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separatorOpaque,
  },
  catPillActive: { backgroundColor: Colors.accent },
  catText: { fontSize: 13, color: Colors.label },
  catTextActive: { color: "#fff", fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.mutedForeground,
    letterSpacing: -0.1,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 2,
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    gap: 12,
    ...Shadows.xs,
  },
  separator: { height: 6 },
  docEmoji: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docBody: { flex: 1, gap: 3 },
  docTitle: { fontSize: 14, fontWeight: "600", color: Colors.label, letterSpacing: -0.2 },
  docMeta: { fontSize: 12, color: Colors.mutedForeground },
  docRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  empty: { alignItems: "center", paddingTop: 72, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.label },
  emptyDesc: { fontSize: 14, color: Colors.mutedForeground, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },

  sheetFooter: { flexDirection: "row", gap: 10, alignItems: "center" },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.red + "50",
    backgroundColor: Colors.red + "10",
    alignItems: "center",
    justifyContent: "center",
  },
});
