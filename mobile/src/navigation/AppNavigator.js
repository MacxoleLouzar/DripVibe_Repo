import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import WardrobeScreen from '../screens/WardrobeScreen';
import OutfitScreen from '../screens/OutfitScreen';
import ShopScreen from '../screens/ShopScreen';
import ImageSearchScreen from '../screens/ImageSearchScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();

const icons = { Wardrobe: '👗', Outfits: '✨', Shop: '🛍️', 'Find It': '📷' };

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Outfits" component={OutfitScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Find It" component={ImageSearchScreen} />
    </Tab.Navigator>
  );
}
