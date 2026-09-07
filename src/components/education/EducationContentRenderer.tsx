import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { EducationBlock } from '../../types/education';
import { colors } from '../../theme/colors';

type Props = {
  blocks: EducationBlock[];
};

export default function EducationContentRenderer({ blocks }: Props) {
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Text key={`${block.type}-${index}`} style={styles.heading}>
                {block.text}
              </Text>
            );
          case 'paragraph':
            return (
              <Text key={`${block.type}-${index}`} style={styles.paragraph}>
                {block.text}
              </Text>
            );
          case 'bullet':
            return (
              <View key={`${block.type}-${index}`} style={styles.bulletList}>
                {(block.items ?? []).map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            );
          case 'youtube':
            if (!block.url) return null;
            return (
              <Pressable
                key={`${block.type}-${index}`}
                style={({ pressed }) => [styles.videoCard, pressed && styles.videoCardPressed]}
                onPress={() => void Linking.openURL(block.url!)}
              >
                <View style={styles.videoIconWrap}>
                  <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.videoText}>
                  <Text style={styles.videoTitle}>{block.title ?? 'Video izle'}</Text>
                  <Text style={styles.videoSubtitle}>YouTube'da aç</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.creamMuted} />
              </Pressable>
            );
          case 'table': {
            const rows = (block.items ?? []).map((row) => row.split('\t'));
            if (rows.length === 0) return null;
            const colCount = Math.max(...rows.map((row) => row.length), 1);
            return (
              <View key={`${block.type}-${index}`} style={styles.table}>
                {rows.map((row, rowIndex) => (
                  <View
                    key={`row-${rowIndex}`}
                    style={[styles.tableRow, rowIndex === 0 && styles.tableHeaderRow]}
                  >
                    {Array.from({ length: colCount }).map((_, colIndex) => (
                      <View key={`cell-${rowIndex}-${colIndex}`} style={styles.tableCell}>
                        <Text
                          style={[
                            styles.tableCellText,
                            rowIndex === 0 && styles.tableHeaderText,
                          ]}
                        >
                          {row[colIndex] ?? ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          }
          case 'source':
            return (
              <Text key={`${block.type}-${index}`} style={styles.source}>
                {block.text}
              </Text>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.cream,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream,
  },
  bulletList: {
    gap: 8,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.gold,
    width: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 240, 230, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.2)',
  },
  videoCardPressed: {
    opacity: 0.9,
  },
  videoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#C4302B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    flex: 1,
    gap: 2,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cream,
  },
  videoSubtitle: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  source: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.creamMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.25)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(245, 240, 230, 0.18)',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(245, 240, 230, 0.12)',
  },
  tableCellText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.cream,
  },
  tableHeaderText: {
    fontWeight: '800',
    color: colors.gold,
  },
});
