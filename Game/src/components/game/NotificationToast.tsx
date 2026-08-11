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
  const translateY = useRef(new Animated.Value(16)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const leavingRef = useRef(false);

  const startLeave = () => {
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
        toValue: 16,
        duration: 180,
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
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 0,
      duration: notification.durationMs,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      startLeave();
    }, notification.durationMs);

    return () => {
      clearTimeout(timer);
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
        activeOpacity={0.95}
        onPress={startLeave}
        style={[styles.toast, { borderColor: config.color }]}
      >
        <View style={[styles.iconBadge, { backgroundColor: `${config.color}22` }]}> 
          <Ionicons name={config.icon} size={18} color={config.color} />
        </View>

        <Text style={styles.text} numberOfLines={3}>
          {text}
        </Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressFill,
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
    width: 32,
    height: 32,
    borderRadius: 10,
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
  progressContainer: {
    height: 3,
    borderRadius: 999,
    backgroundColor: Theme.colors.surfaceLight,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});