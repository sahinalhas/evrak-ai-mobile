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
      <Markdown style={mdStyles}>{content}</Markdown>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FAFBFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  content: { padding: 20 },
});

const mdStyles = StyleSheet.create({
  body: { color: Colors.label, fontSize: 14.5, lineHeight: 23 },
  heading1: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.label,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginVertical: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.separator,
  },
  heading2: {
    fontSize: 13.5,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.labelSecondary,
    marginTop: 12,
    marginBottom: 3,
  },
  paragraph: { marginBottom: 8, lineHeight: 23, color: Colors.label },
  strong: { fontWeight: "700", color: Colors.label },
  hr: {
    backgroundColor: Colors.separator,
    height: 1,
    marginVertical: 14,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 3 },
  blockquote: {
    backgroundColor: Colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 6,
  },
  table: { borderWidth: 1, borderColor: Colors.separator, borderRadius: 8, overflow: "hidden" },
  th: { backgroundColor: Colors.surface, padding: 8, fontWeight: "700" },
  td: { padding: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator },
  tr: {},
});
