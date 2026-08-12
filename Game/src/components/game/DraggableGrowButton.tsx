import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { GameConstants } from '../../constants/GameConstants';

interface DraggableGrowButtonProps {
  age: number;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export const DraggableGrowButton = ({
  age,
  onPress,
  accessibilityLabel,
  disabled = false,
}: DraggableGrowButtonProps) => {
  const size = GameConstants.DRAG_FAB_SIZE;
  const margin = GameConstants.DRAG_FAB_MARGIN;
  const threshold = GameConstants.DRAG_TAP_THRESHOLD;

  const [ready, setReady] = useState(false);
  const containerLayoutRef = useRef({ width: 0, height: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const startPositionRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const onPressRef = useRef(onPress);
  const disabledRef = useRef(disabled);

  const translateX = useRef(new Animated.Value(-1000)).current;
  const translateY = useRef(new Animated.Value(-1000)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    onPressRef.current = onPress;
    disabledRef.current = disabled;
  }, [onPress, disabled]);

  const clampPosition = (x: number, y: number) => {
    const { width, height } = containerLayoutRef.current;
    const minX = margin;
    const minY = margin;
    const maxX = Math.max(minX, width - size - margin);
    const maxY = Math.max(minY, height - size - margin);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  const applyPosition = (x: number, y: number) => {
    positionRef.current = { x, y };
    translateX.setValue(x);
    translateY.setValue(y);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt: GestureResponderEvent) => !disabledRef.current,
      onMoveShouldSetPanResponder: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (disabledRef.current) {
          return false;
        }

        return Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold;
      },
      onPanResponderGrant: () => {
        movedRef.current = false;
        startPositionRef.current = { ...positionRef.current };

        Animated.spring(scale, {
          toValue: 1.08,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (disabledRef.current) {
          return;
        }

        if (!movedRef.current && (Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold)) {
          movedRef.current = true;
        }

        if (!movedRef.current) {
          return;
        }

        const next = clampPosition(
          startPositionRef.current.x + gestureState.dx,
          startPositionRef.current.y + gestureState.dy
        );

        applyPosition(next.x, next.y);
      },
      onPanResponderRelease: () => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (disabledRef.current) {
          return;
        }

        if (!movedRef.current) {
          onPressRef.current();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        movedRef.current = false;
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    containerLayoutRef.current = { width, height };

    if (!ready) {
      const initial = clampPosition(width - size - margin, height - size - margin);
      applyPosition(initial.x, initial.y);
      setReady(true);
      return;
    }

    const clamped = clampPosition(positionRef.current.x, positionRef.current.y);

    if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
      applyPosition(clamped.x, clamped.y);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.host, { zIndex: GameConstants.DRAG_FAB_Z_INDEX }]}
      onLayout={handleContainerLayout}
    >
      {ready ? (
        <Animated.View
          {...panResponder.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ translateX }, { translateY }, { scale }],
            },
          ]}
        >
          <Ionicons name="hourglass" size={Math.floor(size * 0.42)} color="#221A02" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{String(age)}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    zIndex: GameConstants.DRAG_FAB_Z_INDEX,
  },
  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Theme.colors.gold,
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Theme.colors.gold,
    fontSize: 11,
    fontWeight: '900',
  },
});