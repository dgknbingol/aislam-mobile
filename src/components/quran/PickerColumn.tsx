import { useEffect, useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { colors } from '../../theme/colors';

export interface PickerItem {
  id: string;
  label: string;
  value: number | string;
}

interface PickerColumnProps {
  items: PickerItem[];
  selectedId: string;
  onSelect: (item: PickerItem) => void;
  flex?: number;
}

const ROW_HEIGHT = 44;

export default function PickerColumn({
  items,
  selectedId,
  onSelect,
  flex = 1,
}: PickerColumnProps) {
  const listRef = useRef<FlatList<PickerItem>>(null);

  useEffect(() => {
    const index = items.findIndex((item) => item.id === selectedId);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
    }
  }, [items, selectedId]);

  const renderItem: ListRenderItem<PickerItem> = ({ item }) => {
    const selected = item.id === selectedId;
    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={[styles.row, selected && styles.rowSelected]}
      >
        <Text style={[styles.rowText, selected && styles.rowTextSelected]} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.column, { flex }]}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
              viewPosition: 0.5,
            });
          }, 50);
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    borderRadius: 12,
    backgroundColor: '#F3EDE0',
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: ROW_HEIGHT * 2,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  rowSelected: {
    backgroundColor: colors.bar,
    marginHorizontal: 6,
    borderRadius: 10,
  },
  rowText: {
    fontSize: 16,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  rowTextSelected: {
    color: colors.cream,
    fontWeight: '600',
  },
});
