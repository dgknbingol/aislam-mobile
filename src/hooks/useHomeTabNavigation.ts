import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeTabId } from '../components/HomeBottomNav';
import type { RootStackParamList } from '../navigation/types';

export function useHomeTabNavigation() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (tab: HomeTabId) => {
    switch (tab) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'tesbih':
        navigation.navigate('Tesbih');
        break;
      case 'quiz':
        navigation.navigate('Quiz');
        break;
      case 'quran':
        navigation.navigate('Quran');
        break;
      default:
        break;
    }
  };
}
