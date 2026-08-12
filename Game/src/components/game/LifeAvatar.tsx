import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Theme';
import stagesData from '../../data/stages.json';

export type AvatarAgeGroup = 'child' | 'teen' | 'adult' | 'mature' | 'elder';

type MotionKind = 'crawl' | 'breathe' | 'levitate';

interface LifeAvatarProps {
  age: number;
  cultivationStage: string;
  accessibilityLabel: string;
  stageLabel?: string;
  size?: number;
}

interface QiParticleProps {
  delay: number;
  left: number;
  color: string;
}

interface AuraRingProps {
  ringSize: number;
  color: string;
  delay: number;
}

// Пороги возрастных групп синхронизированы с eventGenerator.ts:
// child меньше 12, teen меньше 18, adult меньше 50, mature меньше 80, elder от 80.
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

// Тир стадии Дао: 0 Смертный, 1 Ци I-III, 2 Основание I-III, 3 Ядро, 4 Бессмертный.
const getStageTier = (stageIndex: number): number => {
  if (stageIndex <= 0) {
    return 0;
  }
  if (stageIndex <= 3) {
    return 1;
  }
  if (stageIndex <= 6) {
    return 2;
  }
  if (stageIndex === 7) {
    return 3;
  }
  return 4;
};

// Цвет ауры по ТОЧНОЙ стадии: каждый прорыв меняет оттенок,
// чтобы стадии визуально отличались и игрок не путался.
const STAGE_AURA_COLORS: Record<string, string> = {
  mortal: '', // смертный без ауры
  qi_condensation_1: '#38BDF8', // голубой — первая ци
  qi_condensation_2: '#22D3EE', // циан — ци плотнее
  qi_condensation_3: '#2DD4BF', // бирюза — пик ци
  foundation_1: '#A855F7', // фиолет — закладка основания
  foundation_2: '#C084FC', // светлый фиолет — основание крепнет
  foundation_3: '#E879F9', // маджента — пик основания
  core_formation: '#FBBF24', // золото — золотое ядро
  immortal: '#F8FAFF', // белое сияние — бессмертный
};

const getAuraColor = (stageId: string, stageIndex: number): string | null => {
  if (stageIndex <= 0) {
    return null;
  }
  return STAGE_AURA_COLORS[stageId] || Theme.colors.secondary;
};

// Матрица эмодзи "возраст x стадия Дао": персонаж меняется и с возрастом, и с прорывами.
const getCharacterEmoji = (group: AvatarAgeGroup, tier: number): string => {
  // Смертный (tier 0): облик зависит только от возраста.
  if (tier === 0) {
    if (group === 'child') {
      return '👶'; // ползающий младенец
    }
    if (group === 'teen') {
      return '🧒'; // отрок
    }
    if (group === 'adult') {
      return '🧑'; // взрослый смертный
    }
    if (group === 'mature') {
      return '🧔'; // зрелый муж
    }
    return '🧓'; // старец
  }
  // Бессмертный (tier 4): дракон-первообраз вне возраста.
  if (tier === 4) {
    return '🐉';
  }
  // Ребёнок-культиватор: юный адепт до Ци, малый маг с Основания.
  if (group === 'child') {
    return tier === 1 ? '🧒' : '🧙';
  }
  // Ци (tier 1): медитация в лотосе.
  if (tier === 1) {
    return group === 'elder' ? '🧘‍️' : '';
  }
  // Основание (tier 2): коленопреклонённое накопление основы.
  if (tier === 2) {
    return group === 'elder' ? '🧎‍♂️' : '🧎';
  }
  // Ядро (tier 3): даос с посохом.
  return group === 'elder' ? '🧙' : '🧙‍♂️';
};

// Вид движения: младенец-смертный ползает, tier 2+ и все elder левитируют,
// остальные дышат в медитации.
const getMotionKind = (group: AvatarAgeGroup, tier: number): MotionKind => {
  if (group === 'child' && tier === 0) {
    return 'crawl';
  }
  if (tier >= 2 || group === 'elder') {
    return 'levitate';
  }
  return 'breathe';
};

// Всплывающая частица Ци: поднимается снизу вверх, появляется и гаснет.
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
  }, [delay]);

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

// Пульсирующее кольцо ауры: каждое следующее кольцо стартует с фазовым сдвигом.
// Число колец растёт с тиром: Ци 1, Основание 2, Ядро 3, Бессмертный 4.
const AuraRing = ({ ringSize, color, delay }: AuraRingProps) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
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
  }, [delay]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.7],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  return (
    <Animated.View
      style={[
        styles.auraRing,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// Анимированный бейдж-аватар взросления персонажа во вкладке Мир.
// Эмодзи подбирается матрицей "возраст x тир стадии", движение — по смыслу
// (ползание / медитация-дыхание / левитация). Аура дифференцирует стадии:
// цвет по точной стадии, число колец по тиру, число частиц по индексу стадии.
// Под бейджем — локализованное имя стадии (stageLabel), чтобы не запутаться.
export const LifeAvatar = ({
  age,
  cultivationStage,
  accessibilityLabel,
  stageLabel,
  size = 76,
}: LifeAvatarProps) => {
  const group = getAvatarAgeGroup(age);
  const stageIndex = getStageIndex(cultivationStage);
  const tier = getStageTier(stageIndex);
  const auraColor = getAuraColor(cultivationStage, stageIndex);
  const emoji = getCharacterEmoji(group, tier);
  const motionKind = getMotionKind(group, tier);

  const emojiSize = Math.round(size * 0.45);
  const labelSize = Math.max(9, Math.round(size * 0.16));

  const motion = useRef(new Animated.Value(0)).current;

  // Основная анимация персонажа перезапускается при смене вида движения.
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
  }, [motionKind]);

  // Трансформации персонажа по виду движения.
  let characterTransform: any[] = [];
  if (motionKind === 'crawl') {
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
  } else if (motionKind === 'levitate') {
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

  // Кольца ауры: число равно тиру (1-4), размеры расходятся концентрически.
  const ringCount = tier <= 0 ? 0 : Math.min(tier, 4);
  const rings: any[] = [];
  for (let i = 0; i < ringCount; i += 1) {
    const ringSize = Math.min(
      size - 2,
      Math.round(size * 0.6) + i * Math.round(size * 0.13)
    );
    rings.push(
      <AuraRing
        key={`aura_ring_${i}`}
        ringSize={ringSize}
        color={auraColor || Theme.colors.secondary}
        delay={i * 250}
      />
    );
  }

  // Частицы Ци: число растёт с индексом стадии (2 + stageIndex, кап 6).
  const particleCount = stageIndex <= 0 ? 0 : Math.min(2 + stageIndex, 6);
  const particles: any[] = [];
  for (let i = 0; i < particleCount; i += 1) {
    const t = particleCount > 1 ? i / (particleCount - 1) : 0.5;
    particles.push(
      <QiParticle
        key={`qi_particle_${i}`}
        delay={i * 400}
        left={Math.round(size * (0.1 + 0.8 * t))}
        color={auraColor || Theme.colors.secondary}
      />
    );
  }

  return (
    <View style={styles.root} accessibilityLabel={accessibilityLabel}>
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
      >
        {particleCount > 0 && auraColor ? (
          <View pointerEvents="none" style={styles.particlesLayer}>
            {particles}
          </View>
        ) : null}
        <View style={styles.center}>
          {rings}
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
      {stageLabel ? (
        <Text
          style={[
            styles.stageLabel,
            {
              color: auraColor || Theme.colors.textMuted,
              fontSize: labelSize,
              marginTop: Math.max(2, Math.round(size * 0.06)),
            },
          ]}
          numberOfLines={1}
        >
          {stageLabel}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
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
  auraRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  character: {
    fontSize: 34,
    lineHeight: 42,
  },
  stageLabel: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});