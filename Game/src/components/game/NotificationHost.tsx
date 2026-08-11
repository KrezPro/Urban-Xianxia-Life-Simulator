import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { NotificationToast } from './NotificationToast';
import { GameConstants } from '../../constants/GameConstants';

export const NotificationHost = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const locale = useLocaleStore((state) => state.locale);

  const visible = notifications.slice(0, GameConstants.NOTIFICATION_MAX_VISIBLE);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {visible.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          locale={locale}
          active
          onDismiss={dismissNotification}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 50,
  },
});