import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { Button, Card } from '../ui';
import { playUiPress } from '../../audio/AudioManager';
import { useLocaleStore } from '../../store/useLocaleStore';
import { Locale } from '../../types';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getDeviceLocaleCandidate,
} from '../../constants/Locales';
import { resolveLocalizedKey } from '../../utils/i18n';

interface LanguageSelectionContentProps {
  initialLocale?: Locale;
  onConfirm: (locale: Locale) => void;
  onClose?: () => void;
}

const LanguageSelectionContent = ({
  initialLocale,
  onConfirm,
  onClose,
}: LanguageSelectionContentProps) => {
  const [selected, setSelected] = useState<Locale>(
    initialLocale ?? getDeviceLocaleCandidate() ?? DEFAULT_LOCALE
  );

  const t = (key: string): string => resolveLocalizedKey(selected, 'settings', key);

  return (
    <View style={styles.content}>
      <Card variant="primary" style={styles.card}>
        <Text style={styles.title}>{t('language_selection.title')}</Text>
        <Text style={styles.subtitle}>{t('language_selection.subtitle')}</Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_LOCALES.map((item) => {
            const active = selected === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={[styles.languageItem, active && styles.languageItemActive]}
                onPress={() => {
                  playUiPress?.();
                  setSelected(item.code);
                }}
              >
                <View style={styles.languageTextBlock}>
                  <Text style={[styles.languageNative, active && styles.languageNativeActive]}>
                    {item.nativeName}
                  </Text>
                  <Text style={styles.languageEnglish}>{item.englishName}</Text>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Button
          title={t('language_selection.confirm')}
          onPress={() => onConfirm(selected)}
          variant="primary"
        />

        {onClose ? (
          <Button
            title={t('language_selection.close')}
            onPress={onClose}
            variant="ghost"
            small
            style={styles.closeButton}
          />
        ) : null}
      </Card>
    </View>
  );
};

export const LanguageSelectionOverlay = () => {
  const currentLocale = useLocaleStore((state) => state.locale);
  const setLocaleAndMarkChosen = useLocaleStore((state) => state.setLocaleAndMarkChosen);
  const initialLocale = getDeviceLocaleCandidate() ?? currentLocale;

  return (
    <SafeAreaView style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <LanguageSelectionContent
          initialLocale={initialLocale}
          onConfirm={(nextLocale) => {
            setLocaleAndMarkChosen(nextLocale);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectionModal = ({ visible, onClose }: LanguageSelectionModalProps) => {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {visible ? (
            <LanguageSelectionContent
              initialLocale={locale}
              onConfirm={(nextLocale) => {
                if (nextLocale !== locale) {
                  setLocale(nextLocale);
                }
                onClose();
              }}
              onClose={onClose}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  overlayContent: {
    flex: 1,
    padding: Theme.spacing.md,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  card: {
    maxHeight: '100%',
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  list: {
    maxHeight: 320,
    flexGrow: 0,
    marginBottom: Theme.spacing.md,
  },
  listContent: {
    paddingBottom: Theme.spacing.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    marginBottom: Theme.spacing.sm,
  },
  languageItemActive: {
    borderColor: Theme.colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  languageTextBlock: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  languageNative: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.md,
    fontWeight: '800',
  },
  languageNativeActive: {
    color: Theme.colors.text,
  },
  languageEnglish: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    marginTop: 2,
  },
  closeButton: {
    marginTop: Theme.spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: Theme.spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    alignSelf: 'center',
  },
});