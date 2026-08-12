import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import StoreScreen from '../screens/StoreScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import ruExtras from '../locales/ru/extras.json';
import enExtras from '../locales/en/extras.json';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const locale = useLocaleStore((state) => state.locale);
  const extras: any = locale === 'ru' ? ruExtras : enExtras;
  const tabBar = extras.navigation?.tab_bar || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.borderSoft,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Theme.colors.text,
        tabBarInactiveTintColor: Theme.colors.textDim,
        tabBarLabel: ({ color }) => {
          let key = 'life';

          if (route.name === 'Dao') {
            key = 'dao';
          }

          if (route.name === 'Activities') {
            key = 'activities';
          }

          if (route.name === 'Store') {
            key = 'store';
          }

          return (
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>
              {tabBar[key] || route.name}
            </Text>
          );
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Life') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'Dao') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Activities') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Store') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Life" component={LifeScreen} />
      <Tab.Screen name="Dao" component={DaoScreen} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
    </Tab.Navigator>
  );
}