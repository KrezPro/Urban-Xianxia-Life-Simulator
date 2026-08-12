import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
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
  onLongPress,
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
      onPress={disabled ? undefined : onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
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

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  size?: number;
  style?: any;
  accessibilityLabel?: string;
}

export const IconButton = ({
  icon,
  onPress,
  variant = 'secondary',
  disabled = false,
  size = 40,
  style,
  accessibilityLabel,
}: IconButtonProps) => {
  const iconColor = variant === 'gold' ? '#221A02' : Theme.colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        variant === 'primary' && styles.iconButtonPrimary,
        variant === 'secondary' && styles.iconButtonSecondary,
        variant === 'danger' && styles.iconButtonDanger,
        variant === 'gold' && styles.iconButtonGold,
        variant === 'ghost' && styles.iconButtonGhost,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.floor(size * 0.52)} color={iconColor} />
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
  onPress?: () => void;
  onLongPress?: () => void;
  dense?: boolean;
  scale?: number;
}

// StatRow поддерживает адаптивное масштабирование: проп scale (дефолт 1)
// умножает бейдж, иконку, шрифты и отступы; dense (дефолт false) дополнительно
// сжимает строку для совместимости со старыми вызовами.
export const StatRow = ({
  icon,
  label,
  value,
  color,
  onPress,
  onLongPress,
  dense = false,
  scale = 1,
}: StatRowProps) => {
  const k = scale * (dense ? 0.75 : 1);
  const badge = Math.round(34 * k);
  const content = (
    <View style={[styles.statRow, { paddingVertical: Math.round(6 * k) }]}>
      <View
        style={[
          styles.statIconBadge,
          {
            width: badge,
            height: badge,
            borderRadius: Math.round(badge * 0.36),
            marginRight: Math.round(12 * k),
          },
          color ? { borderColor: color } : null,
        ]}
      >
        <Ionicons name={icon} size={Math.round(18 * k)} color={color || Theme.colors.secondary} />
      </View>
      <Text style={[styles.statLabel, { fontSize: Math.round(14 * k) }]}>{label}</Text>
      <Text style={[styles.statValue, { fontSize: Math.round(16 * k) }, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
  if (!onPress && !onLongPress) {
    return content;
  }
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} onLongPress={onLongPress} delayLongPress={300}>
      {content}
    </TouchableOpacity>
  );
};

interface DetailsModalProps {
  visible: boolean;
  title: string;
  lines: string[];
  closeLabel: string;
  onClose: () => void;
}

export const DetailsModal = ({ visible, title, lines, closeLabel, onClose }: DetailsModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.detailsBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{title}</Text>
          {lines.map((line, index) => (
            <Text key={`details_line_${index}`} style={styles.detailsLine}>
              {line}
            </Text>
          ))}
          <Button title={closeLabel} onPress={onClose} variant="primary" small style={styles.detailsButton} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Theme.shadow,
  },
  iconButtonPrimary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primarySoft,
  },
  iconButtonSecondary: {
    backgroundColor: Theme.colors.surfaceLight,
    borderColor: Theme.colors.secondary,
  },
  iconButtonDanger: {
    backgroundColor: '#4C1D24',
    borderColor: Theme.colors.danger,
  },
  iconButtonGold: {
    backgroundColor: Theme.colors.gold,
    borderColor: '#FDE68A',
  },
  iconButtonGhost: {
    backgroundColor: 'transparent',
    borderColor: Theme.colors.borderSoft,
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
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSoft,
  },
  statIconBadge: {
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    flex: 1,
    color: Theme.colors.textMuted,
  },
  statValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  detailsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
    padding: Theme.spacing.lg,
    alignItems: 'flex-start',
    ...Theme.shadow,
  },
  detailsTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    marginBottom: Theme.spacing.sm,
    textAlign: 'left',
  },
  detailsLine: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
    marginBottom: 4,
    textAlign: 'left',
  },
  detailsButton: {
    minWidth: 160,
    marginTop: Theme.spacing.md,
    alignSelf: 'center',
  },
});