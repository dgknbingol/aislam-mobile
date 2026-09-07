import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { EducationStackParamList } from './types';
import EducationCategoryQuizScreen from '../screens/education/EducationCategoryQuizScreen';
import EducationCategoryScreen from '../screens/education/EducationCategoryScreen';
import EducationHubScreen from '../screens/education/EducationHubScreen';
import EducationModuleQuizScreen from '../screens/education/EducationModuleQuizScreen';
import EducationModuleScreen from '../screens/education/EducationModuleScreen';
import EducationTopicScreen from '../screens/education/EducationTopicScreen';

const Stack = createNativeStackNavigator<EducationStackParamList>();

export default function EducationStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="EducationHub" component={EducationHubScreen} />
      <Stack.Screen name="EducationCategory" component={EducationCategoryScreen} />
      <Stack.Screen name="EducationModule" component={EducationModuleScreen} />
      <Stack.Screen name="EducationLesson" component={EducationTopicScreen} />
      <Stack.Screen name="EducationModuleQuiz" component={EducationModuleQuizScreen} />
      <Stack.Screen name="EducationCategoryQuiz" component={EducationCategoryQuizScreen} />
    </Stack.Navigator>
  );
}
