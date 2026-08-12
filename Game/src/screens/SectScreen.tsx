import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TextInput,
  StyleSheet,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSocialStore } from '../store/useSocialStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import { formatLargeNumber } from '../utils/helpers';
import ruSocial from '../locales/ru/social.json';
import enSocial from '../locales/en/social.json';

type SectMode = 'sect' | 'leaderboard';

export default function SectScreen() {
  const social = useSocialStore();
  const locale = useLocaleStore((state) => state.locale);

  const [mode, setMode] = useState<SectMode>('sect');
  const [inviteInput, setInviteInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const socialData: any = locale === 'ru' ? ruSocial : enSocial;
  const ui = socialData.sect_screen;

  useEffect(() => {
    if (social.hasHydrated) {
      social.refreshLeaderboard();
      social.simulateOffline(Date.now());
    }
  }, [social.hasHydrated]);

  if (!social.hasHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{ui.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = () => {
    social.createSect(ui.default_name, ui.default_tag);
    setMode('sect');
  };

  const handleJoin = () => {
    const success = social.joinSectByInvite(inviteInput);

    if (!success) {
      setJoinError(ui.join_error);
      return;
    }

    setInviteInput('');
    setJoinError('');
    setMode('sect');
  };

  const handleLeave = () => {
    Alert.alert(
      ui.leave_confirm_title,
      ui.leave_confirm_message,
      [
        {
          text: ui.no,
          style: 'cancel',
        },
        {
          text: ui.yes,
          style: 'destructive',
          onPress: () => {
            social.leaveSect();
          },
        },
      ]
    );
  };

  const handleShareInvite = () => {
    if (!social.sect) {
      return;
    }

    Share.share({
      message: social.sect.inviteCode,
    });
  };

  const renderLeaderboardItem = ({ item, index }: { item: any; index: number }) => {
    const rank = index + 1;
    const displayName = item.isPlayer ? `${item.name} *` : item.name;

    return (
      <View style={[styles.leaderboardRow, item.isPlayer && styles.leaderboardRowPlayer]}>
        <Text style={styles.leaderboardRank}>#{rank}</Text>

        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{displayName}</Text>
          <Text style={styles.leaderboardTag}>[{item.tag}]</Text>
        </View>

        <Text style={styles.leaderboardScore}>{formatLargeNumber(item.score)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{ui.title}</Text>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'sect' && styles.segmentButtonActive]}
            onPress={() => setMode('sect')}
          >
            <Text style={[styles.segmentText, mode === 'sect' && styles.segmentTextActive]}>
              {ui.tab_my_sect}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentButton, mode === 'leaderboard' && styles.segmentButtonActive]}
            onPress={() => setMode('leaderboard')}
          >
            <Text style={[styles.segmentText, mode === 'leaderboard' && styles.segmentTextActive]}>
              {ui.tab_leaderboard}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'sect' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!social.sect ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{ui.empty_title}</Text>
              <Text style={styles.emptyText}>{ui.empty_text}</Text>

              <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
                <Text style={styles.primaryButtonText}>{ui.btn_create}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={inviteInput}
                onChangeText={(text) => {
                  setInviteInput(text);
                  setJoinError('');
                }}
                placeholder={ui.invite_placeholder}
                placeholderTextColor={Theme.colors.textDim}
                autoCapitalize="characters"
              />

              <TouchableOpacity style={styles.secondaryButton} onPress={handleJoin}>
                <Text style={styles.secondaryButtonText}>{ui.btn_join}</Text>
              </TouchableOpacity>

              {joinError !== '' ? <Text style={styles.errorText}>{joinError}</Text> : null}
            </View>
          ) : (
            <View style={styles.sectCard}>
              <Text style={styles.sectName}>
                {social.sect.name} [{social.sect.tag}]
              </Text>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{ui.season}</Text>
                <Text style={styles.statValue}>{social.seasonId}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{ui.funds}</Text>
                <Text style={styles.statValueGold}>${formatLargeNumber(social.sect.funds)}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{ui.influence}</Text>
                <Text style={styles.statValueInfo}>{formatLargeNumber(social.sect.influence)}</Text>
              </View>

              <View style={styles.inviteCard}>
                <Text style={styles.inviteLabel}>
                  {ui.invite_code}: {social.sect.inviteCode}
                </Text>

                <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
                  <Text style={styles.shareButtonText}>{ui.share_invite}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
                <Text style={styles.dangerButtonText}>{ui.btn_leave}</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>{ui.members}</Text>

              {social.sect.members.map((member) => {
                const displayName = member.id === 'player' ? ui.player_name : member.name;

                return (
                  <View key={member.id} style={styles.memberRow}>
                    <Text style={styles.memberName}>{displayName}</Text>
                    <Text style={styles.memberContribution}>
                      {ui.contribution}: {formatLargeNumber(member.contribution)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={social.leaderboard}
            renderItem={renderLeaderboardItem}
            estimatedItemSize={72}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>{ui.leaderboard_empty}</Text>}
          />
        </View>
      )}
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
  },
  loadingText: {
    color: Theme.colors.primarySoft,
    fontSize: Theme.fontSize.lg,
    fontWeight: '800',
  },
  headerContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  segmentText: {
    color: Theme.colors.textDim,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: Theme.colors.text,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.text,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    marginBottom: Theme.spacing.md,
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  primaryButtonText: {
    color: Theme.colors.text,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.text,
    fontWeight: '900',
  },
  errorText: {
    color: Theme.colors.danger,
    marginTop: Theme.spacing.sm,
  },
  sectCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
  },
  sectName: {
    color: Theme.colors.info,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: Theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSoft,
  },
  statLabel: {
    color: Theme.colors.textMuted,
  },
  statValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  statValueGold: {
    color: Theme.colors.gold,
    fontWeight: '900',
  },
  statValueInfo: {
    color: Theme.colors.info,
    fontWeight: '900',
  },
  inviteCard: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
    alignItems: 'flex-start',
  },
  inviteLabel: {
    color: Theme.colors.gold,
    fontWeight: '800',
    marginBottom: Theme.spacing.sm,
  },
  shareButton: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  shareButtonText: {
    color: Theme.colors.text,
    fontWeight: '900',
  },
  dangerButton: {
    backgroundColor: '#4C1D24',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  dangerButtonText: {
    color: Theme.colors.text,
    fontWeight: '900',
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  memberRow: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  memberName: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    fontWeight: '800',
  },
  memberContribution: {
    color: Theme.colors.gold,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  leaderboardRowPlayer: {
    borderColor: Theme.colors.primarySoft,
  },
  leaderboardRank: {
    color: Theme.colors.secondary,
    fontWeight: '900',
    width: 42,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  leaderboardTag: {
    color: Theme.colors.textDim,
    marginTop: 2,
  },
  leaderboardScore: {
    color: Theme.colors.success,
    fontWeight: '900',
  },
});