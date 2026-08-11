import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import LogScreen from '../screens/LogScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
          borderBottomWidth: 1,
          borderBottomColor: '#333',
        },
        headerTintColor: '#00ffcc',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopWidth: 1,
          borderTopColor: '#333',
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#00ffcc',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Профиль',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>
        }} 
      />
      <Tab.Screen 
        name="Life" 
        component={LifeScreen} 
        options={{ 
          title: 'Мир',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏢</Text>
        }} 
      />
      <Tab.Screen 
        name="Dao" 
        component={DaoScreen} 
        options={{ 
          title: 'Дао',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☯️</Text>
        }} 
      />
      <Tab.Screen 
        name="Log" 
        component={LogScreen} 
        options={{ 
          title: 'Журнал',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📜</Text>
        }} 
      />
    </Tab.Navigator>
  );
}