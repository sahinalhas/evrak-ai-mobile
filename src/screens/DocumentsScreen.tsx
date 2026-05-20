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
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Star,
  FileText,
  Share2,
  Trash2,
  Home,
  Briefcase,
  GraduationCap,
  User,
  BookOpen,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { DialogSheet, GradientButton, Badge } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";

const CATEGORIES = ["Tümü", "Hukuki", "İş Hayatı", "Eğitim", "Kişisel"] as const;

const CATEGORY_COLORS: Record<string, { bg: string; icon: string; gradient: string[] }> = {
  Hukuki: { bg: "#ffe4e4", icon: "#ef4444", gradient: ["#ef4444", "#dc2626"] },
  "İş Hayatı": { bg: "#fef3c7", icon: "#f59e0b", gradient: ["#f59e0b", "#d97706"] },
  Eğitim: { bg: "#dbeafe", icon: "#3b82f6", gradient: ["#3b82f6", "#2563eb"] },
  Kişisel: { bg: "#d1fae5", icon: "#10b981", gradient: ["#10b981", "#059669"] },
  default: { bg: Colors.primaryLight, icon: Colors.primary, gradient: Colors.gradientPrimary as unknown as string[] },
};

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  Hukuki: Home,
  "İş Hayatı": Briefcase,
  Eğitim: GraduationCap,
  Kişisel: User,
};

export const DocumentsScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tümü");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useFocusEffect(
    useCallback(() => {
      StorageService.getDocuments().then(setDocuments);
    }, [])
  );

  const toggleFavorite = async (id: string) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d));
    setDocuments(updated);
    await StorageService.saveDocuments(updated);
  };

  const deleteDocument = (id: string) => {
    Alert.alert("Belgeyi Sil", "Bu belge kalıcı olarak silinecek. Emin misiniz?", [
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
    try {
      await Share.share({ message: doc.content, title: `${doc.title} — EvrakAI` });
    } catch {}
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

  const getIcon = (category: string) => {
    const IconComp = CATEGORY_ICONS[category] || BookOpen;
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
    return { IconComp, colors };
  };

  const renderDoc = ({ item }: { item: Document }) => {
    const { IconComp, colors } = getIcon(item.category);
    return (
      <TouchableOpacity onPress={() => setSelectedDoc(item)} activeOpacity={0.78} style={styles.docCard}>
        <LinearGradient colors={colors.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.docIconWrap}>
          <IconComp size={18} color="#fff" />
        </LinearGradient>

        <View style={styles.docBody}>
          <View style={styles.docTitleRow}>
            <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
            {item.favorite && <Star size={12} color={Colors.warning} fill={Colors.warning} />}
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docDate}>{item.date}</Text>
            <View style={[styles.statusDot, { backgroundColor: item.status === "Tamamlandı" ? Colors.success : Colors.warning }]} />
            <Text style={[styles.docStatus, { color: item.status === "Tamamlandı" ? Colors.success : Colors.warning }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.docActions}>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.actionIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Star size={15} color={item.favorite ? Colors.warning : Colors.mutedForeground} fill={item.favorite ? Colors.warning : "transparent"} />
          </TouchableOpacity>
          <ChevronRight size={14} color={Colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <FileText size={32} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Henüz belge yok</Text>
      <Text style={styles.emptyDesc}>
        {query ? "Arama kriterlerine uyan belge bulunamadı." : "Sohbet sekmesinden ilk belgenizi oluşturun!"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Belgelerim</Text>
          <Text style={styles.headerSub}>{documents.length} belge</Text>
        </View>
        <View style={styles.headerBadgeWrap}>
          <Badge label={`${favorites.length} ★`} color={Colors.warning} bg={Colors.warningLight} size="md" />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Belgelerde ara…"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        renderItem={({ item: c }) => {
          const active = activeCategory === c;
          return (
            <TouchableOpacity onPress={() => setActiveCategory(c)} activeOpacity={0.8} style={[styles.catBtn, active && styles.catBtnActive]}>
              <Text style={[styles.catText, active && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        }}
        style={styles.catScroll}
      />

      {/* List */}
      <FlatList
        data={[
          ...(favorites.length > 0 ? [{ _type: "section", label: "⭐ Favoriler" }, ...favorites] : []),
          ...(rest.length > 0 ? [{ _type: "section", label: favorites.length > 0 ? "Diğerleri" : "Tüm Belgeler" }, ...rest] : []),
        ] as any[]}
        keyExtractor={(item, i) => item.id ?? `section-${i}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => {
          if (item._type === "section") {
            return <Text style={styles.sectionLabel}>{item.label}</Text>;
          }
          return renderDoc({ item });
        }}
      />

      {/* Detail Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          subtitle={`${selectedDoc.type} · ${selectedDoc.date}`}
          footer={
            <View style={styles.sheetFooterRow}>
              <TouchableOpacity onPress={() => deleteDocument(selectedDoc.id)} style={styles.deleteBtn}>
                <Trash2 size={16} color={Colors.destructive} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.foreground },
  headerSub: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  headerBadgeWrap: { paddingTop: 4 },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    ...Shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.foreground },
  clearBtn: { fontSize: 12, color: Colors.mutedForeground, padding: 4 },

  catScroll: { maxHeight: 50 },
  catRow: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 12, fontWeight: "500", color: Colors.mutedForeground },
  catTextActive: { color: "#fff", fontWeight: "700" },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.mutedForeground,
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 2,
  },

  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 13,
    ...Shadows.sm,
  },
  docIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docBody: { flex: 1, gap: 4 },
  docTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  docTitle: { fontSize: 13, fontWeight: "700", color: Colors.foreground, flex: 1 },
  docMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  docDate: { fontSize: 11, color: Colors.mutedForeground },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  docStatus: { fontSize: 10, fontWeight: "600" },
  docActions: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  actionIconBtn: { padding: 4 },

  emptyState: { alignItems: "center", paddingTop: 64, gap: 14 },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.foreground },
  emptyDesc: { fontSize: 13, color: Colors.mutedForeground, textAlign: "center", paddingHorizontal: 40, lineHeight: 19 },

  sheetFooterRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  deleteBtn: {
    width: 48,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.destructive + "40",
    backgroundColor: Colors.destructive + "10",
    alignItems: "center",
    justifyContent: "center",
  },
});
