import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "./Theme";

type Props = { content: string; maxHeight?: number };

export const MarkdownView: React.FC<Props> = ({ content, maxHeight }) => (
  <View style={[styles.wrapper, maxHeight ? { maxHeight } : { flex: 1 }]}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Markdown style={md}>{content}</Markdown>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
  },
  scroll:   { flex: 1 },
  content:  { padding: 18 },
});

const md = StyleSheet.create({
  body:     { color: Colors.label, fontSize: 15, lineHeight: 23 },
  heading1: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.label,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginVertical: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  heading2: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.label2,
    marginTop: 12,
    marginBottom: 3,
  },
  paragraph:    { marginBottom: 8, lineHeight: 23 },
  strong:       { fontWeight: "700" },
  hr:           { backgroundColor: Colors.separator, height: StyleSheet.hairlineWidth, marginVertical: 14 },
  bullet_list:  { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item:    { marginVertical: 3 },
  blockquote: {
    backgroundColor: Colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  table:  { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, borderRadius: 8, overflow: "hidden" },
  th:     { backgroundColor: Colors.fill, padding: 8, fontWeight: "700", fontSize: 13 },
  td:     { padding: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator, fontSize: 14 },
});
