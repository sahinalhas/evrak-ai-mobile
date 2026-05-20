import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TextInput,
  TouchableOpacity, Share, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Search, Trash2, Share2, Copy, FileText, X } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Shadows } from "../components/Theme";
import { DialogSheet, GradientButton } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";
import { StorageService, SavedDocument } from "../services/storage";

const CAT_LABELS: Record<string, string> = {
  dilekce: "Dilekçe", basvuru: "Başvuru", taahut: "Taahhütname",
  sozlesme: "Sözleşme", mektup: "Mektup", diger: "Diğer",
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  dilekce:  { bg: "rgba(79,70,229,0.08)",  text: "#4F46E5" },
  basvuru:  { bg: "rgba(16,185,129,0.08)", text: "#059669" },
  taahut:   { bg: "rgba(245,158,11,0.08)", text: "#D97706" },
  sozlesme: { bg: "rgba(239,68,68,0.08)",  text: "#DC2626" },
  mektup:   { bg: "rgba(99,102,241,0.08)", text: "#6366F1" },
  diger:    { bg: "rgba(0,0,0,0.05)",       text: "#6B7280" },
};

function guessCategory(content: string): string {
  const c = content.toLowerCase();
  if (c.includes("dilekç") || c.includes("sayın")) return "dilekce";
  if (c.includes("başvur") || c.includes("talep")) return "basvuru";
  if (c.includes("taahhüt")) return "taahut";
  if (c.includes("sözleşme") || c.includes("taraflar")) return "sozlesme";
  if (c.includes("mektup") || c.includes("referans") || c.includes("sevgili")) return "mektup";
  return "diger";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  if (diff < 7) return `${diff} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function firstLine(content: string): string {
  return content.split("\n").filter(l => l.trim()).slice(0, 2).join(" ").replace(/[#*_]/g, "").trim();
}

export const DocumentsScreen: React.FC = () => {
  const [docs, setDocs] = useState<SavedDocument[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<SavedDocument | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));
  const load = async () => setDocs(await StorageService.getDocuments());

  const filtered = docs.filter(d => {
    const matchQuery = !query ||
      d.content.toLowerCase().includes(query.toLowerCase()) ||
      d.preview?.toLowerCase().includes(query.toLowerCase());
    const matchCat = !activeFilter || guessCategory(d.content) === activeFilter;
    return matchQuery && matchCat;
  });

  const deleteDoc = (id: string) =>
    Alert.alert("Belgeyi Sil", "Bu belge kalıcı olarak silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          await StorageService.deleteDocument(id);
          setSelectedDoc(null);
          load();
        },
      },
    ]);

  const shareDoc = async (content: string) => {
    try { await Share.share({ message: content, title: "EvrakAI Belgesi" }); } catch {}
  };

  const copyDoc = async (content: string) => {
    try {
      const { Clipboard } = await import("expo-clipboard");
      await Clipboard.setStringAsync(content);
      Alert.alert("Kopyalandı", "Belge panoya kopyalandı.");
    } catch {}
  };

  const cats = [...new Set(docs.map(d => guessCategory(d.content)))];

  const Empty = () => (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <FileText size={30} color={Colors.label3} strokeWidth={1.2} />
      </View>
      <Text style={s.emptyTitle}>
        {query ? "Sonuç bulunamadı" : "Henüz belge yok"}
      </Text>
      <Text style={s.emptySub}>
        {query
          ? "Farklı anahtar kelimeler deneyin"
          : "Sohbet sekmesinden ilk belgenizi oluşturun"}
      </Text>
    </View>
  );

  const renderCard = ({ item }: { item: SavedDocument }) => {
    const cat = guessCategory(item.content);
    const catStyle = CAT_COLORS[cat];
    return (
      <TouchableOpacity
        onPress={() => setSelectedDoc(item)}
        activeOpacity={0.76}
        style={s.card}
      >
        <View style={s.cardRow}>
          <View style={s.cardIcon}>
            <FileText size={16} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {item.preview || CAT_LABELS[cat]}
            </Text>
            <Text style={s.cardPreview} numberOfLines={2}>
              {firstLine(item.content)}
            </Text>
          </View>
        </View>
        <View style={s.cardMeta}>
          <Text style={s.cardDate}>{formatDate(item.createdAt)}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.catTag, { backgroundColor: catStyle.bg }]}>
              <Text style={[s.catTagText, { color: catStyle.text }]}>{CAT_LABELS[cat]}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteDoc(item.id)}
              style={s.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={13} color={Colors.label3} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={s.header}>
        <View>
          <Text style={s.pageTitle}>Belgelerim</Text>
          {docs.length > 0 && (
            <Text style={s.pageCount}>{docs.length} belge kaydedildi</Text>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={[s.searchBar, searchFocused && s.searchBarFocused]}>
          <Search size={15} color={searchFocused ? Colors.accent : Colors.label3} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Belgelerinizde ara…"
            placeholderTextColor={Colors.label3}
            style={s.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={Colors.label3} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filters */}
      {cats.length > 1 && (
        <View style={s.filters}>
          <TouchableOpacity
            onPress={() => setActiveFilter(null)}
            style={[s.filterChip, !activeFilter && s.filterChipActive]}
          >
            <Text style={[s.filterText, !activeFilter && s.filterTextActive]}>Tümü</Text>
          </TouchableOpacity>
          {cats.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveFilter(activeFilter === c ? null : c)}
              style={[s.filterChip, activeFilter === c && s.filterChipActive]}
            >
              <Text style={[s.filterText, activeFilter === c && s.filterTextActive]}>
                {CAT_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {cats.length > 1 && <View style={s.divider} />}

      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        renderItem={renderCard}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={<Empty />}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Sheet */}
      <DialogSheet
        visible={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.preview || "Belge"}
        subtitle={selectedDoc ? formatDate(selectedDoc.createdAt) : ""}
        maxHeight="92%"
        footer={
          selectedDoc && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <GradientButton
                onPress={() => deleteDoc(selectedDoc.id)}
                title="Sil"
                variant="plain"
                size="md"
                style={{ paddingHorizontal: 4 }}
                textStyle={{ color: Colors.red }}
                icon={<Trash2 size={14} color={Colors.red} />}
              />
              <GradientButton
                onPress={() => copyDoc(selectedDoc.content)}
                title="Kopyala"
                variant="tinted"
                size="md"
                style={{ flex: 1 }}
                icon={<Copy size={13} color={Colors.accent} />}
              />
              <GradientButton
                onPress={() => shareDoc(selectedDoc.content)}
                title="Paylaş"
                variant="filled"
                size="md"
                style={{ flex: 1 }}
                icon={<Share2 size={13} color="#fff" />}
              />
            </View>
          )
        }
      >
        {selectedDoc && <MarkdownView content={selectedDoc.content} />}
      </DialogSheet>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: Colors.card,
  },
  pageTitle: { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.6 },
  pageCount: { fontSize: 13, color: Colors.label3, marginTop: 2 },

  searchContainer: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.card,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 9,
    backgroundColor: Colors.fill,
    borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "transparent",
  },
  searchBarFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
    ...Shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.label, letterSpacing: -0.1 },

  filters: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4,
    gap: 7, backgroundColor: Colors.card,
  },
  filterChip: {
    paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.fill,
  },
  filterChipActive: { backgroundColor: Colors.accentLight },
  filterText:       { fontSize: 13, fontWeight: "500", color: Colors.label2 },
  filterTextActive: { color: Colors.accent, fontWeight: "600" },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  list:      { paddingBottom: 36 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 70 },

  card: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
    gap: 12,
  },
  cardRow: { flexDirection: "row", gap: 13 },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 15, fontWeight: "600", color: Colors.label,
    letterSpacing: -0.3,
  },
  cardPreview: { fontSize: 13, color: Colors.label2, lineHeight: 19 },
  cardMeta:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: 53 },
  cardDate:    { fontSize: 12, color: Colors.label3 },
  deleteBtn:   { padding: 4 },
  catTag: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 8,
  },
  catTagText: { fontSize: 11, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.label, marginBottom: 7, letterSpacing: -0.3 },
  emptySub:   { fontSize: 14, color: Colors.label3, textAlign: "center", lineHeight: 21 },
});
