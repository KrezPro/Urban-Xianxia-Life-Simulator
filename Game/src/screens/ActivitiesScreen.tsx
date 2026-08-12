import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber } from '../utils/helpers';
import { getOptionById, meetsLifestyleRequirements } from '../utils/gameplayUtils';
import { getStageName } from '../utils/stageUtils';
import { LifestyleCategory } from '../types';
import lifestyleData from '../data/lifestyle.json';
import ruExtras from '../locales/ru/extras.json';
import enExtras from '../locales/en/extras.json';

export default function ActivitiesScreen() {
  const player = usePlayerStore();
  const lifestyle = useLifestyleStore();
  const locale = useLocaleStore((state) => state.locale);
  const [expanded, setExpanded] = useState<string>('job');

  const extras: any = locale === 'ru' ? ruExtras : enExtras;
  const activities = extras.activities || {};

  const toggleCategory = (categoryId: string) => {
    setExpanded((prev) => (prev === categoryId ? '' : categoryId));
  };

  const getOptionName = (optionId: string): string => {
    return activities.options?.[optionId]?.name || optionId;
  };

  const getOptionDesc = (optionId: string): string => {
    return activities.options?.[optionId]?.desc || '';
  };

  const getRequirementText = (option: any): string => {
    const req = option.requirements;

    if (!req) {
      return '';
    }

    const parts: string[] = [];

    if (req.ageMin) {
      parts.push(`${activities.requirements?.age}: ${req.ageMin}`);
    }

    if (req.intelligence) {
      parts.push(`${activities.requirements?.intelligence}: ${req.intelligence}`);
    }

    if (req.appearance) {
      parts.push(`${activities.requirements?.appearance}: ${req.appearance}`);
    }

    if (req.spiritualRoot) {
      parts.push(`${activities.requirements?.spiritual_root}: ${req.spiritualRoot}`);
    }

    if (req.healthMin) {
      parts.push(`${activities.requirements?.health}: ${req.healthMin}`);
    }

    if (req.maxHealthMin) {
      parts.push(`${activities.requirements?.max_health}: ${req.maxHealthMin}`);
    }

    if (req.stage) {
      parts.push(`${activities.requirements?.stage}: ${getStageName(req.stage, locale)}`);
    }

    return parts.join(', ');
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Card variant="danger" style={styles.deadCard}>
            <Text style={styles.deadText}>{activities.dead_text}</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{activities.title}</Text>

        <Card variant="gold" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{`$${formatLargeNumber(player.money)}`}</Text>
        </Card>

        {(lifestyleData as any).categories.map((category: any) => {
          const categoryKey = category.id as LifestyleCategory;
          const selectedId = lifestyle.selected[categoryKey];
          const selectedOption = getOptionById(selectedId);
          const isOpen = expanded === category.id;

          return (
            <Card key={category.id} style={styles.categoryCard}>
              <Button
                title={`${activities.categories?.[category.id] || category.id} — ${
                  selectedOption ? getOptionName(selectedOption.id) : activities.none
                }`}
                onPress={() => toggleCategory(category.id)}
                variant="secondary"
                icon={isOpen ? 'chevron-up' : 'chevron-down'}
                style={styles.categoryButton}
              />

              {isOpen ? (
                <View style={styles.optionsContainer}>
                  {category.options.map((option: any) => {
                    const isSelected = selectedId === option.id;
                    const meets = meetsLifestyleRequirements(option, player);
                    const requirementText = getRequirementText(option);

                    return (
                      <View key={option.id} style={styles.optionCard}>
                        <View style={styles.optionHeader}>
                          <Text style={styles.optionName}>{getOptionName(option.id)}</Text>
                          <Text style={styles.optionTier}>T{option.tier}</Text>
                        </View>

                        <Text style={styles.optionDesc}>{getOptionDesc(option.id)}</Text>

                        <View style={styles.optionMetaRow}>
                          <Text style={styles.optionMetaLabel}>{activities.daily_cost}</Text>
                          <Text style={styles.optionMetaValue}>
                            ${formatLargeNumber(option.dailyCost || '0')}
                          </Text>
                        </View>

                        {!!option.dailyIncome ? (
                          <View style={styles.optionMetaRow}>
                            <Text style={styles.optionMetaLabel}>{activities.daily_income}</Text>
                            <Text style={[styles.optionMetaValue, styles.incomeValue]}>
                              ${formatLargeNumber(option.dailyIncome)}
                            </Text>
                          </View>
                        ) : null}

                        {!!requirementText ? (
                          <Text style={styles.requirementText}>
                            {activities.requirements_label}: {requirementText}
                          </Text>
                        ) : null}

                        {isSelected ? (
                          <View style={styles.optionButtonRow}>
                            <Button
                              title={activities.selected}
                              onPress={() => undefined}
                              disabled
                              variant="secondary"
                              small
                              style={styles.optionButton}
                            />
                            {option.id !== `${category.id}_none` ? (
                              <Button
                                title={activities.disable}
                                onPress={() => lifestyle.disableOption(categoryKey)}
                                variant="danger"
                                small
                                style={[styles.optionButton, styles.optionButtonRight]}
                              />
                            ) : null}
                          </View>
                        ) : (
                          <Button
                            title={meets ? activities.select : activities.locked}
                            onPress={() => lifestyle.selectOption(categoryKey, option.id)}
                            disabled={!meets}
                            variant={meets ? 'primary' : 'ghost'}
                            small
                            style={styles.optionButton}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  balanceLabel: {
    color: Theme.colors.gold,
    fontSize: 30,
    fontWeight: '900',
  },
  categoryCard: {
    marginBottom: Theme.spacing.md,
  },
  categoryButton: {
    alignSelf: 'stretch',
  },
  optionsContainer: {
    marginTop: Theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionName: {
    color: Theme.colors.text,
    fontWeight: '900',
    flex: 1,
  },
  optionTier: {
    color: Theme.colors.textDim,
    fontWeight: '800',
    marginLeft: 8,
  },
  optionDesc: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginBottom: 8,
  },
  optionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionMetaLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  optionMetaValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  incomeValue: {
    color: Theme.colors.success,
  },
  requirementText: {
    color: Theme.colors.warning,
    fontSize: Theme.fontSize.xs,
    marginTop: 4,
    marginBottom: 8,
  },
  optionButtonRow: {
    flexDirection: 'row',
  },
  optionButton: {
    flex: 1,
    marginTop: 4,
  },
  optionButtonRight: {
    marginLeft: 8,
  },
  deadCard: {
    width: '100%',
    alignItems: 'center',
  },
  deadText: {
    color: Theme.colors.danger,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
});