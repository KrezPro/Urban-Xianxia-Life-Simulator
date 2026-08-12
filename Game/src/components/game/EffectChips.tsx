import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/Theme';
import { EffectChip } from '../../types';
import { useLocaleStore } from '../../store/useLocaleStore';
import { formatLargeNumber } from '../../utils/helpers';
import ruEventGenerator from '../../locales/ru/eventGenerator.json';
import enEventGenerator from '../../locales/en/eventGenerator.json';

interface EffectChipsProps {
  effects: EffectChip[];
  maxVisible?: number;
}

export const EffectChips = ({ effects, maxVisible = 4 }: EffectChipsProps) => {
  const locale = useLocaleStore((state) => state.locale);
  const dictionary: any = locale === 'ru' ? ruEventGenerator : enEventGenerator;

  if (!effects || 0 === effects.length) {
    return null;
  }

  const visible = effects.slice(0, maxVisible);
  const hidden = effects.length - visible.length;

  const getStatLabel = (stat: EffectChip['stat']): string => {
    return dictionary.stats?.[stat] || stat;
  };

  const getValueText = (effect: EffectChip): string => {
    const sign = effect.positive ? '+' : '-';

    if (effect.stat === 'money') {
      return `${sign}$${formatLargeNumber(effect.amount)}`;
    }

    if (effect.stat === 'qi') {
      return `${sign}${formatLargeNumber(effect.amount)}`;
    }

    return `${sign}${effect.amount}`;
  };

  return (
    <View style={styles.row}>
      {visible.map((effect, index) => (
        <View
          key={`${effect.stat}_${index.toString()}`}
          style={[
            styles.chip,
            {
              borderColor: effect.positive ? Theme.colors.success : Theme.colors.danger,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: effect.positive ? Theme.colors.success : Theme.colors.danger,
              },
            ]}
          >
            {getValueText(effect)} {getStatLabel(effect.stat)}
          </Text>
        </View>
      ))}

      {hidden > 0 ? (
        <View style={[styles.chip, { borderColor: Theme.colors.textMuted }]}> 
          <Text style={[styles.chipText, { color: Theme.colors.textMuted }]}>+{hidden}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
});