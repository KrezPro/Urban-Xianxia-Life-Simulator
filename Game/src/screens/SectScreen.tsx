import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSocialStore } from '../store/useSocialStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useEventStore } from '../store/useEventStore';
import { GameConstants } from '../constants/GameConstants';
import { formatLargeNumber } from '../utils/formatUtils';
import ruSocial from '../locales/ru/social.json';
import enSocial from '../locales/en/social.json';

export default function SectScreen() {
  const social = useSocialStore();
  const locale = useLocaleStore((state) => state.locale);
  const { addLog } = useEventStore();
  const [inviteInput, setInviteInput] = useState('');

  const socialData: any = locale === 'ru' ? ruSocial : enSocial;
  const uiData = socialData.sect_screen;
  const seasonId = new Date().toISOString().slice(0, 7);

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
          <Text style={styles.loadingText}>{uiData.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = () => {
    social.createSect(uiData.default_name, uiData.default_tag, seasonId);
    addLog(uiData.log_created.replace('{name}', uiData.default_name), 'system');
  };

  const handleJoin = () => {
    const success = social.joinSectByInvite(inviteInput, seasonId);

    if (success) {
      const joinedName = useSocialStore.getState().sect?.name || '';
      addLog(uiData.log_joined.replace('{name}', joinedName), 'system');
      setInviteInput('');
    }
  };

  const handleContribute = () => {
    const result = social.contribute(GameConstants.SOCIAL_MIN_CONTRIBUTION_MONEY);

    if (result === 'ok') {
      addLog(uiData.log_contribute, 'system');
    }

    if (result === 'no_money') {
      addLog(uiData.log_no_money, 'system');
    }
  };

  const handleLeave = () => {
    social.leaveSect();
    addLog(uiData.log_left, 'system');
  };

  if (!social.sect) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{uiData.title}</Text>

          <View style={styles.card}>
            <Text style={styles.emptyTitle}>{uiData.empty_title}</Text>
            <Text style={styles.emptyText}>{uiData.empty_text}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
              <Text style={styles.primaryButtonText}>{uiData.btn_create}</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder={uiData.invite_input_placeholder}
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.secondaryButton} onPress={handleJoin}>
              <Text style={styles.secondaryButtonText}>{uiData.btn_join}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{uiData.title}</Text>

        <View style={styles.card}>
          <Text style={styles.sectName}>{social.sect.name} [{social.sect.tag}]</Text>
          <Text style={styles.statText}>{uiData.invite_code}: {social.sect.inviteCode}</Text>
          <Text style={styles.statText}>{uiData.funds}: ${formatLargeNumber(social.sect.funds)}</Text>
          <Text style={styles.statText}>{uiData.influence}: {formatLargeNumber(social.sect.influence)}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContribute}>
            <Text style={styles.primaryButtonText}>{uiData.btn_contribute}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
            <Text style={styles.dangerButtonText}>{uiData.btn_leave}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{uiData.members}</Text>
          {social.sect.members.map((member) => {
            const displayName = member.id === 'player' ? uiData.player_name : member.name;

            return (
              <View key={member.id} style={styles.memberRow}>
                <Text style={styles.memberName}>{displayName}</Text>
                <Text style={styles.memberContribution}>
                  {uiData.contribution}: {formatLargeNumber(member.contribution)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{uiData.leaderboard_title}</Text>

          {social.leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>{uiData.leaderboard_empty}</Text>
          ) : (
            social.leaderboard.map((entry, index) => {
              const rank = index + 1;
              const playerName = entry.isPlayer ? `${entry.name} *` : entry.name;

              return (
                <View key={entry.id} style={styles.leaderboardRow}>
                  <Text style={styles.leaderboardRank}>#{rank}</Text>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{playerName}</Text>
                    <Text style={styles.leaderboardTag}>[{entry.tag}]</Text>
                  </View>
                  <Text style={styles.leaderboardScore}>{formatLargeNumber(entry.score)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  loadingText: {
    color: '#8e44ad',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 16,
  },
  sectName: {
    color: '#9b59b6',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statText: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  memberRow: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  memberName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberContribution: {
    color: '#f1c40f',
    marginTop: 4,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  leaderboardRank: {
    color: '#3498db',
    fontWeight: 'bold',
    width: 40,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: '#fff',
    fontWeight: '600',
  },
  leaderboardTag: {
    color: '#888',
    marginTop: 2,
  },
  leaderboardScore: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
});