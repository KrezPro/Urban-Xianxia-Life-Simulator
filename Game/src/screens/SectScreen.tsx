import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSocialStore } from '../store/useSocialStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useEventStore } from '../store/useEventStore';
import { GameConstants } from '../constants/GameConstants';
import { formatLargeNumber } from '../utils/formatUtils';
import { isGreaterOrEqualBigInt } from '../utils/bigIntUtils';
import { Theme } from '../constants/Theme';
import ruSocial from '../locales/ru/social.json';
import enSocial from '../locales/en/social.json';

type SectMode = 'sect' | 'leaderboard';

export default function SectScreen() {
  const social = useSocialStore();
  const player = usePlayerStore();
  const locale = useLocaleStore((state) => state.locale);
  const { addLog } = useEventStore();

  const [mode, setMode] = useState<SectMode>('sect');
  const [inviteInput, setInviteInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const socialData: any = locale === 'ru' ? ruSocial : enSocial;
  const ui = socialData.sect_screen;
  const minContribution = GameConstants.SOCIAL_MIN_CONTRIBUTION_MONEY;
  const minContributionLabel = formatLargeNumber(minContribution);
  const canAffordDonation = isGreaterOrEqualBigInt(player.money, minContribution);

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
    addLog(ui.log_created.replace('{name}', ui.default_name), 'system');
    setMode('sect');
  };

  const handleJoin = () => {
    const success = social.joinSectByInvite(inviteInput);

    if (!success) {
      setJoinError(ui.join_error);
      return;
    }

    const joinedName = useSocialStore.getState().sect?.name || '';
    addLog(ui.log_joined.replace('{name}', joinedName), 'system');
    setInviteInput('');
    setJoinError('');
    setMode('sect');
  };

  const handleDonate = () => {
    const result = social.contribute(minContribution);

    if (result === 'ok') {
      addLog(ui.log_contribute.replace('{amount}', `$${minContributionLabel}`), 'system');
    }

    if (result === 'no_money') {
      addLog(ui.log_no_money, 'system');
    }
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
            addLog(ui.log_left, 'system');
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

  const renderEmptyLeaderboard = () => {
    return <Text style={styles.emptyText}>{ui.leaderboard_empty}</Text>;
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
            <View style={styles.card}>
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
            <View style={styles.card}>
              <Text style={styles.sectName}>
                {social.sect.name} [{social.sect.tag}]
              </Text>

              <Text style={styles.statText}>
                {ui.season}: {social.seasonId}
              </Text>
              <Text style={styles.statText}>
                {ui.funds}: ${formatLargeNumber(social.sect.funds)}
              </Text>
              <Text style={styles.statText}>
                {ui.influence}: {formatLargeNumber(social.sect.influence)}
              </Text>

              <View style={styles.inviteBlock}>
                <Text style={styles.inviteLabel}>
                  {ui.invite_code}: {social.sect.inviteCode}
                </Text>
                <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
                  <Text style={styles.shareButtonText}>{ui.share_invite}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, !canAffordDonation && styles.disabledButton]}
                onPress={handleDonate}
                disabled={!canAffordDonation}
              >
                <Text style={styles.primaryButtonText}>
                  {ui.donate.replace('{amount}', minContributionLabel)}
                </Text>
              </TouchableOpacity>

              {!canAffordDonation ? (
                <Text style={styles.hintText}>
                  {ui.donate_hint.replace('{amount}', `$${minContributionLabel}`)}
                </Text>
              ) : null}

              <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
                <Text style={styles.dangerButtonText}>{ui.btn_leave}</Text>
              </TouchableOpacity>

              <View style={styles.membersBlock}>
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
            ListEmptyComponent={renderEmptyLeaderboard}
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
    color: Theme.colors.primary,
    fontSize: Theme.fontSize.lg,
    fontWeight: 'bold',
  },
  headerContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm + 2,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  segmentText: {
    color: Theme.colors.textDim,
    fontWeight: 'bold',
  },
  segmentTextActive: {
    color: Theme.colors.text,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    width: '100%',
    marginBottom: Theme.spacing.md,
  },
  emptyTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.md,
  },
  input: {
    backgroundColor: Theme.colors.cardAlt,
    color: Theme.colors.text,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.sm + 4,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  primaryButtonText: {
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.sm + 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: Theme.colors.textDim,
  },
  dangerButton: {
    backgroundColor: Theme.colors.danger,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.sm + 4,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  dangerButtonText: {
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
  errorText: {
    color: Theme.colors.danger,
    marginTop: Theme.spacing.sm,
  },
  hintText: {
    color: Theme.colors.warning,
    marginBottom: Theme.spacing.sm,
  },
  sectName: {
    color: Theme.colors.info,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.sm,
  },
  statText: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    marginBottom: Theme.spacing.xs,
  },
  inviteBlock: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.cardAlt,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
  },
  inviteLabel: {
    color: Theme.colors.gold,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.sm,
  },
  shareButton: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  shareButtonText: {
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
  membersBlock: {
    marginTop: Theme.spacing.md,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.sm,
  },
  memberRow: {
    backgroundColor: Theme.colors.cardAlt,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.sm,
  },
  memberName: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
  },
  memberContribution: {
    color: Theme.colors.gold,
    marginTop: Theme.spacing.xs,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardAlt,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.sm + 2,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  leaderboardRowPlayer: {
    borderColor: Theme.colors.primary,
  },
  leaderboardRank: {
    color: Theme.colors.secondary,
    fontWeight: 'bold',
    width: 42,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  leaderboardTag: {
    color: Theme.colors.textDim,
    marginTop: 2,
  },
  leaderboardScore: {
    color: Theme.colors.success,
    fontWeight: 'bold',
  },
});