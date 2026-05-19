import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "./Theme";

type MarkdownViewProps = {
  content: string;
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
  },
  contentContainer: {
    padding: 20,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.foreground,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "System",
  },
  heading1: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.foreground,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  heading2: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.foreground,
    marginTop: 18,
    marginBottom: 6,
    lineHeight: 20,
  },
  heading3: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.mutedForeground,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 19,
  },
  strong: {
    fontWeight: "700",
    color: Colors.foreground,
  },
  bullet_list: {
    marginVertical: 6,
  },
  ordered_list: {
    marginVertical: 6,
  },
  list_item: {
    marginVertical: 2,
    lineHeight: 18,
  },
  hr: {
    backgroundColor: Colors.border,
    height: 1,
    marginVertical: 14,
  },
});
