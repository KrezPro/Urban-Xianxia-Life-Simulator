import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationToast } from './NotificationToast';
import { getContentMaxWidth, getWindowDimensions, scaleSize } from '../../utils/layout';

export const NotificationHost = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);
  const insets = useSafeAreaInsets();

  if (0 === notifications.length) {
    return null;
  }

  const notification = notifications[0];

  if (!notification) {
    return null;
  }

  const { width } = getWindowDimensions();
  const hostWidth = Math.min(width - scaleSize(24), getContentMaxWidth());
  const left = (width - hostWidth) / 2;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          top: insets.top + scaleSize(8),
          left,
          width: hostWidth,
        },
      ]}
    >
      <NotificationToast notification={notification} onDismiss={dismissNotification} />
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    zIndex: 1000,
  },
});