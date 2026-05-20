import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "./Theme";

type MarkdownViewProps = {
  content: string;
  maxHeight?: number;
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, maxHeight }) => {
  return (
    <View style={[styles.wrapper, maxHeight ? { maxHeight } : { flex: 1 }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Markdown style={markdownStyles}>{content}</Markdown>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.muted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  container: { flex: 1 },
  contentContainer: { padding: 18 },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.foreground,
    fontSize: 13,
    lineHeight: 19,
  },
  heading1: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.foreground,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 14,
    lineHeight: 22,
  },
  heading2: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 6,
    lineHeight: 20,
  },
  heading3: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.mutedForeground,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 19,
  },
  strong: {
    fontWeight: "700",
    color: Colors.foreground,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2, lineHeight: 18 },
  hr: {
    backgroundColor: Colors.border,
    height: 1,
    marginVertical: 12,
  },
});
