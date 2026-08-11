import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
  textStyle?: any;
  small?: boolean;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  textStyle,
  small = false,
}: ButtonProps) => {
  const iconColor = variant === 'gold' ? '#221A02' : Theme.colors.text;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'gold' && styles.buttonGold,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={small ? 16 : 20}
          color={iconColor}
          style={styles.buttonIcon}
        />
      ) : null}

      <Text
        style={[
          styles.buttonText,
          small && styles.buttonTextSmall,
          variant === 'gold' && styles.buttonTextDark,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

type CardVariant = 'default' | 'primary' | 'gold' | 'danger';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: any;
}

export const Card = ({ children, variant = 'default', style }: CardProps) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'primary' && styles.cardPrimary,
        variant === 'gold' && styles.cardGold,
        variant === 'danger' && styles.cardDanger,
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  style?: any;
}

export const ProgressBar = ({ progress, color, height = 12, style }: ProgressBarProps) => {
  const safe = 0 > progress ? 0 : progress;
  const clamped = 1 > safe ? safe : 1;
  const widthPercent = `${Math.floor(clamped * 100)}%`;

  return (
    <View style={[styles.progressContainer, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          {
            width: widthPercent,
            backgroundColor: color || Theme.colors.primarySoft,
          },
        ]}
      />
    </View>
  );
};

interface StatRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}

export const StatRow = ({ icon, label, value, color }: StatRowProps) => {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIconBadge, color ? { borderColor: color } : null]}>
        <Ionicons name={icon} size={18} color={color || Theme.colors.secondary} />
      </View>

      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    ...Theme.shadow,
  },
  buttonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.sm,
  },
  buttonPrimary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primarySoft,
  },
  buttonSecondary: {
    backgroundColor: Theme.colors.surfaceLight,
    borderColor: Theme.colors.secondary,
  },
  buttonDanger: {
    backgroundColor: '#4C1D24',
    borderColor: Theme.colors.danger,
  },
  buttonGold: {
    backgroundColor: Theme.colors.gold,
    borderColor: '#FDE68A',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: Theme.colors.border,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: Theme.colors.text,
    fontWeight: '800',
    fontSize: Theme.fontSize.md,
    letterSpacing: 0.4,
  },
  buttonTextSmall: {
    fontSize: Theme.fontSize.sm,
  },
  buttonTextDark: {
    color: '#221A02',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
    ...Theme.shadow,
  },
  cardPrimary: {
    borderColor: 'rgba(168, 85, 247, 0.55)',
    backgroundColor: '#171225',
  },
  cardGold: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: '#1D1607',
  },
  cardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: '#1D0B10',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSoft,
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  statValue: {
    color: Theme.colors.text,
    fontWeight: '800',
    fontSize: Theme.fontSize.md,
  },
});