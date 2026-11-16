import { Linking, StyleSheet, Text, View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

import type { Message } from '../types/chat';
import { colors } from '../theme/colors';

interface ChatBubbleProps {
  message: Message;
}

const assistantMarkdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textOnLight,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textOnLight,
    marginBottom: 8,
    marginTop: 4,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnLight,
    marginBottom: 6,
    marginTop: 4,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnLight,
    marginBottom: 4,
    marginTop: 2,
  },
  strong: {
    fontWeight: '800',
    color: colors.textOnLight,
  },
  em: {
    fontStyle: 'italic',
  },
  s: {
    textDecorationLine: 'line-through',
  },
  link: {
    color: colors.bar,
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: 'rgba(2, 23, 52, 0.05)',
    borderColor: colors.gold,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
  },
  code_inline: {
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: 'rgba(2, 23, 52, 0.06)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(2, 23, 52, 0.06)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  code_block: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(2, 23, 52, 0.06)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  bullet_list: {
    marginBottom: 6,
  },
  ordered_list: {
    marginBottom: 6,
  },
  list_item: {
    marginVertical: 2,
  },
  hr: {
    backgroundColor: colors.barBorder,
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  table: {
    borderColor: colors.barBorder,
    borderRadius: 8,
    marginVertical: 6,
  },
  th: {
    fontWeight: '800',
    padding: 6,
  },
  td: {
    padding: 6,
  },
});

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={[styles.text, styles.userText]}>{message.text}</Text>
        ) : (
          <Markdown
            style={assistantMarkdownStyles}
            onLinkPress={(url) => {
              void Linking.openURL(url);
              return false;
            }}
          >
            {message.text}
          </Markdown>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.bar,
    borderBottomRightRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.cream,
  },
});
