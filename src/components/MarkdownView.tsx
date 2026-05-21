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
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
    padding: 20,
  },
});

const md = StyleSheet.create({
  body:     { color: Colors.label, fontSize: 15, lineHeight: 25 },
  heading1: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.label2,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginVertical: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  heading2: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.0,
    marginTop: 20,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.label2,
    marginTop: 16,
    marginBottom: 5,
  },
  paragraph:    { marginBottom: 10, lineHeight: 25 },
  strong:       { fontWeight: "800" },
  hr:           { backgroundColor: Colors.separator, height: StyleSheet.hairlineWidth, marginVertical: 18 },
  bullet_list:  { marginVertical: 7 },
  ordered_list: { marginVertical: 7 },
  list_item:    { marginVertical: 5 },
  blockquote: {
    backgroundColor: Colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    marginVertical: 10,
  },
  table:  { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, borderRadius: 12, overflow: "hidden" },
  th:     { backgroundColor: Colors.fill, padding: 11, fontWeight: "700", fontSize: 13 },
  td:     { padding: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.separator, fontSize: 14 },
});
