import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EducationStackParamList } from '../../navigation/types';
import { useEducationCatalog } from '../../hooks/useEducationCatalog';
import { colors } from '../../theme/colors';

type RouteProps = RouteProp<EducationStackParamList, 'EducationCategoryQuiz'>;

export default function EducationCategoryQuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { getCategory } = useEducationCatalog();
  const category = getCategory(route.params.categoryId);
  const quiz = category?.quiz;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{quiz?.title ?? 'Genel Quiz'}</Text>
          <Text style={styles.headerSubtitle}>{category?.title}</Text>
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <Ionicons name="ribbon-outline" size={40} color={colors.gold} />
        <Text style={styles.title}>Genel quiz hazırlanıyor</Text>
        <Text style={styles.text}>
          {quiz
            ? `${quiz.questionCount} soruluk kategori quizi ve başarım sistemi bir sonraki adımda eklenecek.`
            : 'Bu kategori için quiz tanımı bulunamadı.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.cream },
  headerSubtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 2 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: colors.textOnLight },
  text: { fontSize: 14, lineHeight: 21, color: colors.textMutedOnLight, textAlign: 'center' },
});
