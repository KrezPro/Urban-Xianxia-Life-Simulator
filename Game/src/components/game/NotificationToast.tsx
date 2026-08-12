import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { INotification, NotificationType } from '../../types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { getNotificationBody, getNotificationTitle } from '../../utils/notificationUtils';
import { EffectChips } from './EffectChips';

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

const rarityColor: Record<string, string> = {
  common: Theme.colors.textMuted,
  uncommon: Theme.colors.success,
  rare: Theme.colors.info,
  epic: Theme.colors.gold,
  legendary: Theme.colors.danger,
};

export const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
  const locale = useLocaleStore((state) => state.locale);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;
  const leavingRef = useRef(false);
  const timerRef = useRef<any>(null);

  const dismiss = () => {
    if (leavingRef.current) {
      return;
    }

    leavingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

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

    timerRef.current = setTimeout(() => {
      dismiss();
    }, notification.durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [notification.id]);

  const iconName = iconByType[notification.type] || 'information-circle';
  const accent = notification.rarity
    ? rarityColor[notification.rarity] || colorByType[notification.type]
    : colorByType[notification.type] || Theme.colors.textMuted;

  const title = getNotificationTitle(notification, locale);
  const body = getNotificationBody(notification, locale);

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

        <View style={styles.textBlock}>
          {!!title ? (
            <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}

          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>

          {!!notification.effects?.length ? <EffectChips effects={notification.effects} /> : null}
        </View>
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
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  body: {
    color: Theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});