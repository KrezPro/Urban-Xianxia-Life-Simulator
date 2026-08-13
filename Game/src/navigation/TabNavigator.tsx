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
import { playTab } from '../audio/AudioManager';
import { resolveLocalizedKey } from '../utils/i18n';
import type { Locale } from '../types';

const Tab = createBottomTabNavigator();

const getTabKey = (routeName: string): string => {
  if (routeName === 'Dao') {
    return 'dao';
  }
  if (routeName === 'Activities') {
    return 'activities';
  }
  if (routeName === 'Store') {
    return 'store';
  }
  if (routeName === 'Settings') {
    return 'settings';
  }
  return 'life';
};

const getTabLabel = (routeName: string, locale: Locale): string => {
  const key = getTabKey(routeName);
  const uiLabel = resolveLocalizedKey(locale, 'ui', `tab_bar.${key}`);
  if (uiLabel) {
    return uiLabel;
  }
  const extrasLabel = resolveLocalizedKey(locale, 'extras', `navigation.tab_bar.${key}`);
  return extrasLabel || routeName;
};

export default function TabNavigator() {
  const locale = useLocaleStore((state) => state.locale);

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
          const label = getTabLabel(route.name, locale);
          return (
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>
              {label}
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
            playTab?.();
          },
        })}
      />
      <Tab.Screen
        name="Dao"
        component={DaoScreen}
        listeners={() => ({
          tabPress: () => {
            playTab?.();
          },
        })}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesScreen}
        listeners={() => ({
          tabPress: () => {
            playTab?.();
          },
        })}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        listeners={() => ({
          tabPress: () => {
            playTab?.();
          },
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={() => ({
          tabPress: () => {
            playTab?.();
          },
        })}
      />
    </Tab.Navigator>
  );
}