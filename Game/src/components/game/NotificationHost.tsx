import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { GameConstants } from '../../constants/GameConstants';

export const NotificationHost = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const insets = useSafeAreaInsets();

  if (0 === notifications.length) {
    return null;
  }

  const visible = notifications.slice(0, GameConstants.NOTIFICATION_MAX_VISIBLE);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          top: insets.top + 8,
        },
      ]}
    >
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
    left: 16,
    right: 16,
    zIndex: 1000,
  },
});