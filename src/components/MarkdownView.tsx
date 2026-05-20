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
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  content: { padding: 16 },
});

const mdStyles = StyleSheet.create({
  body: { color: Colors.label, fontSize: 15, lineHeight: 22 },
  heading1: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.label,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginVertical: 12,
  },
  heading2: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.label,
    marginTop: 14,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.mutedForeground,
    marginTop: 10,
    marginBottom: 2,
  },
  paragraph: { marginBottom: 8, lineHeight: 22 },
  strong: { fontWeight: "700" },
  hr: { backgroundColor: Colors.separator, height: StyleSheet.hairlineWidth, marginVertical: 12 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
});
