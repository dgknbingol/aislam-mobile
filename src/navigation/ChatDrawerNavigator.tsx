import { createDrawerNavigator } from '@react-navigation/drawer';

import ChatDrawerContent from '../components/ChatDrawerContent';
import ChatScreen from '../screens/ChatScreen';

const Drawer = createDrawerNavigator();

export default function ChatDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <ChatDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          width: '82%',
        },
        overlayColor: 'rgba(0, 0, 0, 0.35)',
      }}
    >
      <Drawer.Screen name="ChatMain" component={ChatScreen} />
    </Drawer.Navigator>
  );
}
