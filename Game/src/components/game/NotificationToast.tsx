import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { INotification, NotificationType } from '../../types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { getNotificationText } from '../../utils/notificationUtils';

interface NotificationToastProps {
  notification: INotification;
  onDismiss: (id: string) => void;
}

const iconByType: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  mundane: 'earth',
  secret: 'sparkles',
  system: 'information-circle',
  reward: 'gift',
  danger: 'skull',
  social: 'people',
};

const colorByType: Record<NotificationType, string> = {
  mundane: Theme.colors.secondary,
  secret: Theme.colors.info,
  system: Theme.colors.textMuted,
  reward: Theme.colors.gold,
  danger: Theme.colors.danger,
  social: Theme.colors.success,
};

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const locale = useLocaleStore((state) => state.locale);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;
  const leavingRef = useRef(false);

  const dismiss = () => {
    if (leavingRef.current) {
      return;
    }

    leavingRef.current = true;

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
  };

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
      dismiss();
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const iconName = iconByType[notification.type] || 'information-circle';
  const accent = colorByType[notification.type] || Theme.colors.textMuted;
  const text = getNotificationText(notification, locale);

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
      <TouchableOpacity activeOpacity={0.95} onPress={dismiss} style={styles.inner}>
        <View style={[styles.iconBadge, { borderColor: accent }]}>
          <Ionicons name={iconName} size={18} color={accent} />
        </View>

        <Text style={styles.text} numberOfLines={2}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadow,
    marginBottom: Theme.spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});