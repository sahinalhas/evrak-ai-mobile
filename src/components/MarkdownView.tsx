import React from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "./Theme";

type Props = { content: string; maxHeight?: number };

export const MarkdownView: React.FC<Props> = ({ content, maxHeight }) => (
  <View style={[styles.wrapper, maxHeight ? { maxHeight } : undefined]}>
    <Markdown style={md}>{content}</Markdown>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.bg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
    padding: 18,
  },
});

const md = StyleSheet.create({
  body:     { color: Colors.label, fontSize: 15, lineHeight: 24 },
  heading1: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.label,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginVertical: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  heading2: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.label2,
    marginTop: 14,
    marginBottom: 4,
  },
  paragraph:    { marginBottom: 10, lineHeight: 24 },
  strong:       { fontWeight: "700" },
  hr:           { backgroundColor: Colors.separator, height: StyleSheet.hairlineWidth, marginVertical: 16 },
  bullet_list:  { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  list_item:    { marginVertical: 4 },
  blockquote: {
    backgroundColor: Colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  table:  { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, borderRadius: 10, overflow: "hidden" },
  th:     { backgroundColor: Colors.fill, padding: 10, fontWeight: "700", fontSize: 13 },
  td:     { padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator, fontSize: 14 },
});
