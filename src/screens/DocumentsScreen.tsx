import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Search, Star, FileText, MoreVertical, Share2, Trash2 } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { Colors, Shadows, Typography } from "../components/Theme";
import { StorageService, Document } from "../services/storage";
import { DialogSheet, GradientButton } from "../components/ui";
import { MarkdownView } from "../components/MarkdownView";

const CATEGORIES = ["Tümü", "Hukuki", "İş Hayatı", "Eğitim", "Kişisel"] as const;

export const DocumentsScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tümü");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Load documents when screen becomes focused
  useEffect(() => {
    if (isFocused) {
      loadDocuments();
    }
  }, [isFocused]);

  const loadDocuments = async () => {
    const list = await StorageService.getDocuments();
    setDocuments(list);
  };

  const toggleFavorite = async (id: string) => {
    const updated = documents.map((doc) => {
      if (doc.id === id) {
        return { ...doc, favorite: !doc.favorite };
      }
      return doc;
    });
    setDocuments(updated);
    await StorageService.saveDocuments(updated);
  };

  const deleteDocument = async (id: string) => {
    Alert.alert(
      "Belgeyi Sil",
      "Bu belgeyi kalıcı olarak silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const updated = documents.filter((doc) => doc.id !== id);
            setDocuments(updated);
            await StorageService.saveDocuments(updated);
            if (selectedDoc?.id === id) {
              setSelectedDoc(null);
            }
          },
        },
      ]
    );
  };

  const handleShare = async (doc: Document) => {
    try {
      await Share.share({
        message: doc.content,
        title: `${doc.title} — EvrakAI`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesCategory = activeCategory === "Tümü" || doc.category === activeCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.type.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Belgelerim</Text>
        <Text style={styles.headerSubtitle}>Oluşturduğunuz tüm belgeler burada.</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchCard}>
          <Search size={16} color={Colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Belgelerde ara…"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Category Selection Filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIES.map((c) => {
            const active = activeCategory === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setActiveCategory(c)}
                activeOpacity={0.8}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Documents List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollListContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyView}>
            <FileText size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Aradığınız kriterlere uygun belge bulunamadı.</Text>
          </View>
        ) : (
          filtered.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setSelectedDoc(d)}
              activeOpacity={0.7}
              style={styles.docCard}
            >
              <View style={styles.docIconContainer}>
                <FileText size={20} color={Colors.primary} />
              </View>
              <View style={styles.docInfo}>
                <View style={styles.docTitleRow}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {d.title}
                  </Text>
                  {d.favorite && <Star size={12} color={Colors.warning} fill={Colors.warning} />}
                </View>
                <View style={styles.docMetaRow}>
                  <Text style={styles.docDate}>{d.date}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      d.status === "Tamamlandı" ? styles.statusSuccess : styles.statusWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        d.status === "Tamamlandı"
                          ? styles.statusSuccessText
                          : styles.statusWarningText,
                      ]}
                    >
                      {d.status}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <TouchableOpacity
                onPress={() => toggleFavorite(d.id)}
                style={styles.actionBtn}
              >
                <Star size={16} color={d.favorite ? Colors.warning : Colors.mutedForeground} fill={d.favorite ? Colors.warning : "transparent"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteDocument(d.id)}
                style={styles.actionBtn}
              >
                <Trash2 size={16} color={Colors.destructive} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Document Viewer Sheet */}
      {selectedDoc && (
        <DialogSheet
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          footer={
            <View style={styles.sheetButtons}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Başarılı", "Belge metni kopyalandı!");
                  setSelectedDoc(null);
                }}
                style={[styles.sheetBtn, styles.sheetBtnOutline]}
              >
                <FileText size={16} color={Colors.foreground} />
                <Text style={styles.sheetBtnTextOutline}>Kopyala</Text>
              </TouchableOpacity>
              <GradientButton
                onPress={() => handleShare(selectedDoc)}
                title="Belgeyi Paylaş"
                style={styles.sheetBtnPrimary}
                icon={<Share2 size={16} color={Colors.primaryForeground} />}
              />
            </View>
          }
        >
          <View style={styles.sheetScrollWrapper}>
            <MarkdownView content={selectedDoc.content} />
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                ⚠️ Bu belge hukuki tavsiye yerine geçmez. Önemli resmi işlemleriniz için bir avukata danışmanız önemle tavsiye edilir.
              </Text>
            </View>
          </View>
        </DialogSheet>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 42,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.foreground,
  },
  filterSection: {
    paddingVertical: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.mutedForeground,
  },
  filterBtnTextActive: {
    color: Colors.primaryForeground,
    fontWeight: "600",
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  emptyView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    ...Shadows.sm,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
    justifyContent: "center",
  },
  docTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.foreground,
    maxWidth: "85%",
  },
  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  docDate: {
    fontSize: 10,
    color: Colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: "#ecfdf5",
  },
  statusWarning: {
    backgroundColor: "#fffbeb",
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "600",
  },
  statusSuccessText: {
    color: Colors.success,
  },
  statusWarningText: {
    color: Colors.warning,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  // Sheet Dialog structure styles
  sheetScrollWrapper: {
    height: 380,
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
