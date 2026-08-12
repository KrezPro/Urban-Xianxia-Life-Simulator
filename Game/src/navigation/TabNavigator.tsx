import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LifeScreen from '../screens/LifeScreen';
import DaoScreen from '../screens/DaoScreen';
import StoreScreen from '../screens/StoreScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import { AudioManager } from '../audio/AudioManager';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const locale = useLocaleStore((state) => state.locale);
  const ui: any = locale === 'ru' ? ruUI : enUI;
  const tabBar = ui.tab_bar || {};

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
          if (route.name === 'Settings') {
            key = 'settings';
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
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Life"
        component={LifeScreen}
        listeners={() => ({
          tabPress: () => {
            AudioManager.playTab();
          },
        })}
      />
      <Tab.Screen
        name="Dao"
        component={DaoScreen}
        listeners={() => ({
          tabPress: () => {
            AudioManager.playTab();
          },
        })}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesScreen}
        listeners={() => ({
          tabPress: () => {
            AudioManager.playTab();
          },
        })}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        listeners={() => ({
          tabPress: () => {
            AudioManager.playTab();
          },
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={() => ({
          tabPress: () => {
            AudioManager.playTab();
          },
        })}
      />
    </Tab.Navigator>
  );
}