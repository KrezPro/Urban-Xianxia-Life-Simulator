import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { GameConstants } from '../../constants/GameConstants';
import { INotification, NotificationType } from '../../types';
import { getNotificationText } from '../../utils/notificationUtils';
import { useLocaleStore } from '../../store/useLocaleStore';

interface NotificationToastProps {
  notification: INotification;
  onDismiss: (id: string) => void;
}

const typeConfig: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  mundane: {
    icon: 'earth',
    color: Theme.colors.secondary,
  },
  secret: {
    icon: 'sparkles',
    color: Theme.colors.info,
  },
  system: {
    icon: 'information-circle',
    color: Theme.colors.textMuted,
  },
  reward: {
    icon: 'gift',
    color: Theme.colors.gold,
  },
  danger: {
    icon: 'skull',
    color: Theme.colors.danger,
  },
  social: {
    icon: 'people',
    color: Theme.colors.success,
  },
};

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const locale = useLocaleStore((state) => state.locale);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<any>(null);

  const startLeave = () => {
    if (leaving) {
      return;
    }

    setLeaving(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: GameConstants.NOTIFICATION_ANIMATION_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: GameConstants.NOTIFICATION_ANIMATION_OUT_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id);
    });
  };

  useEffect(() => {
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

    Animated.timing(progress, {
      toValue: 0,
      duration: notification.durationMs,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      startLeave();
    }, notification.durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const config = typeConfig[notification.type] || typeConfig.system;
  const text = getNotificationText(notification, locale);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={startLeave}
        style={[styles.toast, { borderColor: config.color }]}
      >
        <View style={[styles.iconBadge, { backgroundColor: `${config.color}22`, borderColor: config.color }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </View>

        <Text style={styles.text} numberOfLines={2}>
          {text}
        </Text>
      </TouchableOpacity>

      <View style={styles.countdownContainer}>
        <Animated.View
          style={[
            styles.countdownFill,
            {
              width: progressWidth,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
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
    padding: Theme.spacing.sm + 2,
    ...Theme.shadow,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
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
  countdownContainer: {
    height: 3,
    borderRadius: 999,
    backgroundColor: Theme.colors.surfaceLight,
    marginTop: 4,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    borderRadius: 999,
  },
});