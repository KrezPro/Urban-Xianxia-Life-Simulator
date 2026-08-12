import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Theme } from '../../constants/Theme';
import stagesData from '../../data/stages.json';

export type AvatarAgeGroup = 'child' | 'teen' | 'adult' | 'mature' | 'elder';

interface LifeAvatarProps {
  age: number;
  cultivationStage: string;
  accessibilityLabel: string;
  compact?: boolean;
}

interface QiParticleProps {
  delay: number;
  left: number;
  color: string;
}

// Пороги возрастных групп синхронизированы с eventGenerator.ts:
// child < 12, teen < 18, adult < 50, mature < 80, elder >= 80.
export const getAvatarAgeGroup = (age: number): AvatarAgeGroup => {
  if (age < 12) {
    return 'child';
  }
  if (age < 18) {
    return 'teen';
  }
  if (age < 50) {
    return 'adult';
  }
  if (age < 80) {
    return 'mature';
  }
  return 'elder';
};

const getStageIndex = (stageId: string): number => {
  const found = (stagesData as any[]).findIndex((stage) => stage.id === stageId);
  return found < 0 ? 0 : found;
};

// Цвет ауры по стадии культивации: смертный без ауры, Ци — голубой,
// Основание — фиолетовый, Ядро — золотой, Бессмертный — сияющий белый.
const getAuraColor = (stageIndex: number): string | null => {
  if (stageIndex <= 0) {
    return null;
  }
  if (stageIndex <= 3) {
    return Theme.colors.secondary;
  }
  if (stageIndex <= 6) {
    return Theme.colors.primarySoft;
  }
  if (stageIndex === 7) {
    return Theme.colors.gold;
  }
  return '#F4F4FF';
};

const getCharacterEmoji = (group: AvatarAgeGroup, stageIndex: number): string => {
  if (group === 'child') {
    return '👶';
  }
  if (group === 'teen') {
    return '🧒';
  }
  if (group === 'adult' || group === 'mature') {
    return '🧘';
  }
  return stageIndex >= 1 ? '🧙♂️' : '';
};

// Всплывающая частица Ци внутри бейджа: поднимается снизу вверх, появляется и гаснет.
const QiParticle = ({ delay, left, color }: QiParticleProps) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, -22],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.75, 1],
    outputRange: [0, 0.9, 0.9, 0],
  });

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          left,
          color,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
};

// Аватар-бейдж взросления персонажа во вкладке Мир.
// Круглая «монета» 76px (compact 64px): эмодзи по центру, пульсирующее кольцо ауры
// и частицы Ци внутри бейджа. Ребёнок ползает, подросток и взрослый медитируют,
// старейшина-даос левитирует. Всё на встроенном Animated API и emoji, без ассетов.
export const LifeAvatar = ({
  age,
  cultivationStage,
  accessibilityLabel,
  compact = false,
}: LifeAvatarProps) => {
  const group = getAvatarAgeGroup(age);
  const stageIndex = getStageIndex(cultivationStage);
  const auraColor = getAuraColor(stageIndex);
  const showParticles = stageIndex >= 1;
  const emoji = getCharacterEmoji(group, stageIndex);

  const size = compact ? 64 : 76;
  const auraSize = compact ? 48 : 58;
  const emojiSize = compact ? 28 : 34;

  const motion = useRef(new Animated.Value(0)).current;
  const aura = useRef(new Animated.Value(0)).current;

  // Основная анимация персонажа перезапускается при смене возрастной группы.
  useEffect(() => {
    motion.setValue(0);
    const timingOptions = {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    };
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, ...timingOptions }),
        Animated.timing(motion, { toValue: 0, ...timingOptions }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [group]);

  // Пульсация ауры: включается только для культиваторов (индекс стадии >= 1).
  useEffect(() => {
    aura.setValue(0);
    if (!auraColor) {
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [auraColor]);

  // Трансформации персонажа по возрастной группе (амплитуда уменьшена под бейдж).
  let characterTransform: any[] = [];
  if (group === 'child') {
    // Ползание: покачивание влево-вправо с лёгким наклоном.
    const translateX = motion.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, 8],
    });
    const rotate = motion.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['-5deg', '5deg', '-5deg'],
    });
    characterTransform = [{ translateX }, { rotate }];
  } else if (group === 'elder') {
    // Левитация: плавное парение вверх-вниз.
    const translateY = motion.interpolate({
      inputRange: [0, 1],
      outputRange: [2, -4],
    });
    characterTransform = [{ translateY }];
  } else {
    // Медитация: медленное дыхание (пульс масштаба).
    const scale = motion.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.06],
    });
    characterTransform = [{ scale }];
  }

  const auraOpacity = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.7],
  });
  const auraScale = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: auraColor || Theme.colors.borderSoft,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {showParticles && auraColor ? (
        <View pointerEvents="none" style={styles.particlesLayer}>
          <QiParticle delay={0} left={size * 0.14} color={auraColor} />
          <QiParticle delay={800} left={size * 0.46} color={auraColor} />
          <QiParticle delay={1600} left={size * 0.74} color={auraColor} />
        </View>
      ) : null}
      <View style={styles.center}>
        {auraColor ? (
          <Animated.View
            style={[
              styles.aura,
              {
                width: auraSize,
                height: auraSize,
                borderRadius: auraSize / 2,
                borderColor: auraColor,
                opacity: auraOpacity,
                transform: [{ scale: auraScale }],
              },
            ]}
          />
        ) : null}
        <Animated.Text
          style={[
            styles.character,
            {
              fontSize: emojiSize,
              lineHeight: emojiSize + 8,
              transform: characterTransform,
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  particlesLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    bottom: 6,
    fontSize: 8,
    fontWeight: '900',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    borderWidth: 2,
  },
  character: {
    fontSize: 34,
    lineHeight: 42,
  },
});