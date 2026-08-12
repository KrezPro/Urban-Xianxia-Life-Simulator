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
  const translateY = useRef(new Animated.Value(-12)).current;
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
        toValue: -12,
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
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
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

  const text = getNotificationText(notification, locale);
  const icon = iconByType[notification.type] || 'information-circle';
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
      <TouchableOpacity activeOpacity={0.9} onPress={dismiss} style={styles.inner}>
        <View style={[styles.iconBadge, { backgroundColor: `${accent}22` }]}> 
          <Ionicons name={icon} size={16} color={accent} />
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
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadow,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  text: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: Theme.fontSize.sm,
    lineHeight: 18,
  },
});