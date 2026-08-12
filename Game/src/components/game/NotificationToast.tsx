import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { INotification } from '../../types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { getNotificationText } from '../../utils/notificationUtils';
import { getNotificationAreaHeight, isTablet, scaleFont, scaleSize } from '../../utils/layout';

interface NotificationToastProps {
  notification: INotification;
  onDismiss: (id: string) => void;
}

const iconByType = {
  mundane: 'earth',
  secret: 'sparkles',
  system: 'information-circle',
  reward: 'gift',
  danger: 'skull',
  social: 'people',
} as const;

const colorByType = {
  mundane: Theme.colors.secondary,
  secret: Theme.colors.info,
  system: Theme.colors.textMuted,
  reward: Theme.colors.gold,
  danger: Theme.colors.danger,
  social: Theme.colors.success,
} as const;

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const locale = useLocaleStore((state) => state.locale);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;

  const text = getNotificationText(notification, locale);
  const areaHeight = getNotificationAreaHeight();
  const tablet = isTablet();

  const styles = useMemo(
    () => createStyles(areaHeight, text.length, tablet),
    [areaHeight, text.length, tablet]
  );

  useEffect(() => {
    const expiresAt = notification.createdAt + notification.durationMs;
    const remaining = expiresAt - Date.now();

    if (0 >= remaining) {
      onDismiss(notification.id);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -14,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(notification.id);
      });
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const iconName = iconByType[notification.type] || 'information-circle';
  const accent = colorByType[notification.type] || Theme.colors.textMuted;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          borderColor: accent,
        },
      ]}
    >
      <View style={[styles.iconBadge, { borderColor: accent }]}> 
        <Ionicons name={iconName} size={scaleSize(18)} color={accent} />
      </View>

      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
    </Animated.View>
  );
};

const createStyles = (areaHeight: number, textLength: number, tablet: boolean) => {
  const fontSize = textLength > 160 ? 11 : textLength > 100 ? 12 : 13;
  const lineHeight = textLength > 160 ? 15 : 18;

  return StyleSheet.create({
    container: {
      maxHeight: areaHeight,
      borderRadius: scaleSize(14),
      borderWidth: 1,
      backgroundColor: Theme.colors.surface,
      paddingHorizontal: scaleSize(12),
      paddingVertical: scaleSize(10),
      flexDirection: 'row',
      alignItems: 'flex-start',
      ...Theme.shadow,
    },
    iconBadge: {
      width: scaleSize(tablet ? 34 : 28),
      height: scaleSize(tablet ? 34 : 28),
      borderRadius: scaleSize(10),
      backgroundColor: Theme.colors.surfaceLight,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: scaleSize(8),
      marginTop: scaleSize(2),
    },
    text: {
      flex: 1,
      color: Theme.colors.text,
      fontSize: scaleFont(fontSize),
      lineHeight: scaleFont(lineHeight),
      fontWeight: '600',
    },
  });
};