import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { GameConstants } from '../../constants/GameConstants';

export const NotificationHost = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);

  if (0 === notifications.length) {
    return null;
  }

  const visible = notifications.slice(0, GameConstants.NOTIFICATION_MAX_VISIBLE);

  return <View style={styles.host}>{visible.map((notification) => (
    <NotificationToast
      key={notification.id}
      notification={notification}
      onDismiss={dismissNotification}
    />
  ))}</View>;
};

const styles = StyleSheet.create({
  host: {
    zIndex: 1000,
  },
});