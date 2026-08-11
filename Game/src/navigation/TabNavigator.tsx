import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import LogScreen from '../screens/LogScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen name="Мир" component={LifeScreen} />
      <Tab.Screen name="Дао" component={DaoScreen} />
      <Tab.Screen name="Журнал" component={LogScreen} />
    </Tab.Navigator>
  );
}