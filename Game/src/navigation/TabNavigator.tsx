import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import LogScreen from '../screens/LogScreen';
import StoreScreen from '../screens/StoreScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Мир') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'Дао') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Журнал') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Магазин') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Мир" component={LifeScreen} />
      <Tab.Screen name="Дао" component={DaoScreen} />
      <Tab.Screen name="Магазин" component={StoreScreen} />
      <Tab.Screen name="Журнал" component={LogScreen} />
    </Tab.Navigator>
  );
}