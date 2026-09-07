import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeDrawerContent from '../components/HomeDrawerContent';
import HomeScreen from '../screens/HomeScreen';

const Drawer = createDrawerNavigator();

export default function HomeDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <HomeDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: {
          width: '82%',
        },
        overlayColor: 'rgba(0, 0, 0, 0.35)',
      }}
    >
      <Drawer.Screen name="HomeMain" component={HomeScreen} />
    </Drawer.Navigator>
  );
}
