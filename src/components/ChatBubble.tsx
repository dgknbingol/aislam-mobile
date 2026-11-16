import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import ChatMarkdown from './ChatMarkdown';
import type { Message } from '../types/chat';
import { colors } from '../theme/colors';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const { width: windowWidth } = useWindowDimensions();
  // % maxWidth Android/FlatList'te kaçabiliyor; px ile balonu kilitle.
  const bubbleMaxWidth = Math.round(windowWidth * 0.82) - 32;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          { maxWidth: bubbleMaxWidth },
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {isUser ? (
          <Text style={[styles.text, styles.userText]}>{message.text}</Text>
        ) : (
          <ChatMarkdown text={message.text} style={styles.assistantText} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
    flexShrink: 1,
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
    flexShrink: 1,
  },
  userText: {
    color: colors.cream,
  },
  assistantText: {
    color: colors.textOnLight,
    flexShrink: 1,
  },
});
