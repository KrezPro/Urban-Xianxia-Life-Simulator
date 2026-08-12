import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { GameConstants } from '../../constants/GameConstants';

export const NotificationHost = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const pruneExpired = useNotificationStore((state) => state.pruneExpired);

  useEffect(() => {
    pruneExpired();

    const interval = setInterval(() => {
      pruneExpired();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (0 === notifications.length) {
    return null;
  }

  const visible = notifications.slice(0, GameConstants.NOTIFICATION_MAX_VISIBLE);

  return (
    <View style={styles.host} pointerEvents="box-none">
      {visible.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});