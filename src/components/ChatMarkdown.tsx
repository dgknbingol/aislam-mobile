import { Fragment, type ReactNode, useMemo } from 'react';
import { Linking, StyleSheet, Text, type TextStyle } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  text: string;
  style?: TextStyle;
};

type Segment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'strike'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

function preprocessBlocks(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```$/, '');
      return inner.trim();
    })
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trimStart());
}

function parseInline(input: string): Segment[] {
  const segments: Segment[] = [];
  const pattern =
    /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|~~[^~\n]+?~~|`[^`\n]+?`|\*[^*\n]+?\*|_[^_\n]+?_|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: input.slice(last, match.index) });
    }

    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      segments.push({ type: 'bold', value: token.slice(2, -2) });
    } else if (token.startsWith('~~')) {
      segments.push({ type: 'strike', value: token.slice(2, -2) });
    } else if (token.startsWith('`')) {
      segments.push({ type: 'code', value: token.slice(1, -1) });
    } else if (token.startsWith('[')) {
      segments.push({ type: 'link', value: match[2] ?? token, href: match[3] ?? '' });
    } else if (token.startsWith('*') || token.startsWith('_')) {
      segments.push({ type: 'italic', value: token.slice(1, -1) });
    } else {
      segments.push({ type: 'text', value: token });
    }

    last = match.index + token.length;
  }

  if (last < input.length) {
    segments.push({ type: 'text', value: input.slice(last) });
  }

  return segments;
}

function renderSegments(segments: Segment[], baseStyle: TextStyle): ReactNode[] {
  return segments.map((segment, index) => {
    const key = `${segment.type}-${index}`;
    switch (segment.type) {
      case 'bold':
        return (
          <Text key={key} style={[baseStyle, styles.bold]}>
            {segment.value}
          </Text>
        );
      case 'italic':
        return (
          <Text key={key} style={[baseStyle, styles.italic]}>
            {segment.value}
          </Text>
        );
      case 'strike':
        return (
          <Text key={key} style={[baseStyle, styles.strike]}>
            {segment.value}
          </Text>
        );
      case 'code':
        return (
          <Text key={key} style={[baseStyle, styles.code]}>
            {segment.value}
          </Text>
        );
      case 'link':
        return (
          <Text
            key={key}
            style={[baseStyle, styles.link]}
            onPress={() => {
              if (segment.href) void Linking.openURL(segment.href);
            }}
          >
            {segment.value}
          </Text>
        );
      default:
        return <Fragment key={key}>{segment.value}</Fragment>;
    }
  });
}

/**
 * FlatList-safe markdown: sadece nested Text (View yok) → yükseklik bozulmaz.
 */
export default function ChatMarkdown({ text, style }: Props) {
  const prepared = useMemo(() => preprocessBlocks(text), [text]);
  const segments = useMemo(() => parseInline(prepared), [prepared]);
  const baseStyle = StyleSheet.flatten([styles.body, style]);

  return <Text style={baseStyle}>{renderSegments(segments, baseStyle)}</Text>;
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textOnLight,
    flexShrink: 1,
  },
  bold: {
    fontWeight: '800',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  link: {
    color: colors.bar,
    textDecorationLine: 'underline',
  },
});
