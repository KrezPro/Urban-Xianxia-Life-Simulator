import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import StoreScreen from '../screens/StoreScreen';
import SectScreen from '../screens/SectScreen';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI : enUI;

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

          if (route.name === 'Store') {
            key = 'store';
          }

          if (route.name === 'Sect') {
            key = 'sect';
          }

          return (
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>
              {(uiData.tab_bar as any)[key]}
            </Text>
          );
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Life') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'Dao') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Store') {
            iconName = focused ? 'diamond' : 'diamond-outline';
          } else if (route.name === 'Sect') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Life" component={LifeScreen} />
      <Tab.Screen name="Dao" component={DaoScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen name="Sect" component={SectScreen} />
    </Tab.Navigator>
  );
}