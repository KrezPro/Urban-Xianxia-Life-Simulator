import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleSection = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Theme.colors.textMuted}
        />
      </TouchableOpacity>
      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    ...Theme.shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    fontWeight: '900',
  },
  subtitle: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginTop: 2,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
  },
});