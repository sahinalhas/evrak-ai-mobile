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

function firstLines(content: string, n = 3): string {
  return content.split("\n").filter(l => l.trim()).slice(0, n).join("\n");
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
    const matchQuery = !query || d.content.toLowerCase().includes(query.toLowerCase()) || d.preview?.toLowerCase().includes(query.toLowerCase());
    const matchCat = !activeFilter || guessCategory(d.content) === activeFilter;
    return matchQuery && matchCat;
  });

  const deleteDoc = (id: string) =>
    Alert.alert("Sil", "Bu belge kalıcı olarak silinecek.", [
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

  // ── Empty ──────────────────────────────────────────────────────────────────
  const Empty = () => (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <FileText size={28} color={Colors.label3} strokeWidth={1.2} />
      </View>
      <Text style={s.emptyTitle}>
        {query ? "Sonuç bulunamadı" : "Henüz belge yok"}
      </Text>
      <Text style={s.emptySub}>
        {query
          ? "Farklı bir arama deneyin"
          : "Sohbet sekmesinden ilk belgenizi oluşturun"}
      </Text>
    </View>
  );

  // ── Doc card ───────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: SavedDocument }) => {
    const cat = guessCategory(item.content);
    return (
      <TouchableOpacity onPress={() => setSelectedDoc(item)}
        activeOpacity={0.78} style={s.card}>
        <View style={s.cardMain}>
          <View style={s.cardIconWrap}>
            <FileText size={16} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {item.preview || CAT_LABELS[cat]}
            </Text>
            <Text style={s.cardPreview} numberOfLines={2}>
              {firstLines(item.content)}
            </Text>
          </View>
        </View>
        <View style={s.cardFooter}>
          <Text style={s.cardDate}>{formatDate(item.createdAt)}</Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <View style={s.catTag}>
              <Text style={s.catTagText}>{CAT_LABELS[cat]}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteDoc(item.id)} style={s.cardBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

      {/* Large title nav */}
      <View style={s.header}>
        <Text style={s.pageTitle}>Belgelerim</Text>
        <Text style={s.pageCount}>{docs.length} belge</Text>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, searchFocused && s.searchFocused]}>
        <Search size={15} color={Colors.label3} strokeWidth={2} />
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

      {/* Category filter pills */}
      {cats.length > 1 && (
        <View style={s.filterRow}>
          <TouchableOpacity
            onPress={() => setActiveFilter(null)}
            style={[s.filterPill, !activeFilter && s.filterPillActive]}>
            <Text style={[s.filterText, !activeFilter && s.filterTextActive]}>Tümü</Text>
          </TouchableOpacity>
          {cats.map(c => (
            <TouchableOpacity key={c}
              onPress={() => setActiveFilter(activeFilter === c ? null : c)}
              style={[s.filterPill, activeFilter === c && s.filterPillActive]}>
              <Text style={[s.filterText, activeFilter === c && s.filterTextActive]}>
                {CAT_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.hairline} />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={d => d.id}
        renderItem={renderCard}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        ListEmptyComponent={<Empty />}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Doc Detail Sheet */}
      <DialogSheet
        visible={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.preview || "Belge"}
        subtitle={selectedDoc ? formatDate(selectedDoc.createdAt) : ""}
        maxHeight="92%"
        footer={
          selectedDoc && (
            <View style={{ flexDirection: "row", gap: 10 }}>
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

  // Header
  header: {
    flexDirection: "row", alignItems: "baseline", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14,
    backgroundColor: Colors.card,
  },
  pageTitle: { fontSize: 28, fontWeight: "700", color: Colors.label, letterSpacing: -0.6 },
  pageCount: { fontSize: 13, color: Colors.label3 },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 10, marginBottom: 10,
    backgroundColor: Colors.fill,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: "transparent",
  },
  searchFocused: { borderColor: Colors.accent, backgroundColor: Colors.card },
  searchInput: {
    flex: 1, fontSize: 15, color: Colors.label, letterSpacing: -0.2,
  },

  // Filters
  filterRow: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, gap: 7, marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, backgroundColor: Colors.fill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentMid,
  },
  filterText:       { fontSize: 13, fontWeight: "500", color: Colors.label2 },
  filterTextActive: { color: Colors.accent, fontWeight: "600" },

  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  // List
  list: { paddingTop: 0, paddingBottom: 32 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator, marginLeft: 72 },

  // Card
  card: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
  },
  cardMain: { flexDirection: "row", gap: 12, marginBottom: 10 },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  },
  cardTitle: {
    fontSize: 15, fontWeight: "600", color: Colors.label,
    letterSpacing: -0.3, marginBottom: 4,
  },
  cardPreview: { fontSize: 13, color: Colors.label2, lineHeight: 19 },
  cardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardDate:    { fontSize: 12, color: Colors.label3 },
  cardBtn:     { padding: 4 },
  catTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: Colors.fill,
  },
  catTagText: { fontSize: 11, fontWeight: "500", color: Colors.label2 },

  // Empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: Colors.fill,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.label, marginBottom: 6 },
  emptySub:   { fontSize: 15, color: Colors.label3, textAlign: "center", lineHeight: 22 },
});
