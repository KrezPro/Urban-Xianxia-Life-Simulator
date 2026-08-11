import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { GameConstants } from '../../constants/GameConstants';
import { INotification, Locale } from '../../types';
import { getNotificationText } from '../../utils/notificationUtils';

interface NotificationToastProps {
  notification: INotification;
  locale: Locale;
  active: boolean;
  onDismiss: (id: string) => void;
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  mundane: 'earth',
  secret: 'sparkles',
  system: 'information-circle',
  reward: 'gift',
  danger: 'skull',
  social: 'people',
};

const colorMap: Record<string, string> = {
  mundane: Theme.colors.secondary,
  secret: Theme.colors.info,
  system: Theme.colors.textMuted,
  reward: Theme.colors.gold,
  danger: Theme.colors.danger,
  social: Theme.colors.success,
};

export const NotificationToast = ({ notification, locale, active, onDismiss }: NotificationToastProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<any>(null);

  const handleLeave = () => {
    if (leaving) return;
    setLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: GameConstants.NOTIFICATION_ANIMATION_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: GameConstants.NOTIFICATION_ANIMATION_OUT_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  useEffect(() => {
    if (!active || leaving) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: GameConstants.NOTIFICATION_ANIMATION_IN_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: GameConstants.NOTIFICATION_ANIMATION_IN_MS,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      handleLeave();
    }, notification.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, leaving]);

  const accent = colorMap[notification.type] || Theme.colors.textMuted;
  const iconName = iconMap[notification.type] || 'information-circle';
  const text = getNotificationText(notification, locale);

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleLeave} style={[styles.toast, { borderColor: accent }]}>
        <View style={[styles.iconBadge, { borderColor: accent }]}>
          <Ionicons name={iconName} size={18} color={accent} />
        </View>
        <Text style={styles.text} numberOfLines={3}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Theme.spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    padding: Theme.spacing.sm + 4,
    ...Theme.shadow,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  text: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
  },
});