import React, { useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useBreakthrough } from '../hooks/useBreakthrough';
import { useLocaleStore } from '../store/useLocaleStore';
import stagesData from '../data/stages.json';

import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

const formatLargeNumber = (value: string | number): string => {
  const strVal = value.toString();
  const isNegative = strVal.startsWith('-');
  const absVal = isNegative ? strVal.slice(1) : strVal;
  const len = absVal.length;
  
  if (len <= 3) return value.toString();
  
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const suffixIndex = Math.floor((len - 1) / 3);
  
  if (suffixIndex >= suffixes.length) {
    return (isNegative ? "-" : "") + absVal[0] + "." + absVal.slice(1, 3) + "e" + (len - 1);
  }
  
  const remainder = len % 3 === 0 ? 3 : len % 3;
  const mainPart = absVal.slice(0, remainder);
  const decimalPart = absVal.slice(remainder, remainder + 1);
  
  const result = decimalPart === "0" 
    ? `${mainPart}${suffixes[suffixIndex]}` 
    : `${mainPart}.${decimalPart}${suffixes[suffixIndex]}`;
    
  return (isNegative ? "-" : "") + result;
};

export default function DaoScreen() {
  const player = usePlayerStore();
  const locale = useLocaleStore(state => state.locale);
  const { attemptBreakthrough, nextStage, calculateChance } = useBreakthrough();
  
  const [hasAdBuff, setHasAdBuff] = useState(false);
  const uiData = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;

  const currentStage = stagesData.find(s => s.id === player.cultivationStage);
  
  const chance = calculateChance(hasAdBuff);
  const chancePercent = Math.floor(chance * 100);
  
  const currentQiBig = BigInt(player.qi);
  const reqQiBig = nextStage ? BigInt(nextStage.requiredQi) : 0n;
  
  const canBreakthrough = currentQiBig >= reqQiBig && nextStage !== undefined;

  const handleWatchAd = () => {
    // В будущем тут будет вызов SDK вознаграждаемой рекламы
    setHasAdBuff(true);
    Alert.alert(uiData.alert_ad_title, uiData.alert_ad_msg);
  };

  const handleBreakthrough = () => {
    attemptBreakthrough(hasAdBuff, () => setHasAdBuff(false));
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.deadText}>{uiData.dead_text}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{uiData.title}</Text>
        
        <View style={styles.stageCard}>
          <Text style={styles.stageTitle}>
            {uiData.stage} <Text style={styles.stageHighlight}>{currentStage?.name || uiData.unknown}</Text>
          </Text>
          <Text style={styles.stageDesc}>{uiData.qi_energy} {formatLargeNumber(player.qi)}</Text>
          
          <View style={styles.divider} />
          
          {nextStage ? (
            <View style={styles.nextStageContainer}>
              <Text style={styles.nextStageTitle}>{uiData.next_stage}</Text>
              <Text style={styles.nextStageText}>{nextStage.name}</Text>
              <Text style={styles.nextStageText}>
                {uiData.req_qi} {formatLargeNumber(player.qi)} / {formatLargeNumber(nextStage.requiredQi)}
              </Text>
              <Text style={styles.nextStageText}>
                {uiData.success_chance} {chancePercent}%
              </Text>
              
              {!player.hasCultivatorPass && (
                <TouchableOpacity 
                  style={[styles.adBuffBtn, hasAdBuff ? styles.adBuffActive : styles.adBuffIdle]}
                  onPress={handleWatchAd}
                  disabled={hasAdBuff}
                >
                  <Text style={styles.adBuffText}>
                    {hasAdBuff ? uiData.btn_ad_watched : uiData.btn_ad_buff}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.breakthroughBtn, canBreakthrough ? styles.breakthroughBtnActive : styles.breakthroughBtnDisabled]}
                onPress={handleBreakthrough}
                disabled={!canBreakthrough}
              >
                <Text style={styles.breakthroughBtnText}>
                  {canBreakthrough ? uiData.btn_breakthrough : uiData.btn_no_qi}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nextStageContainer}>
              <Text style={styles.maxStageText}>{uiData.max_stage}</Text>
            </View>
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
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    letterSpacing: 2,
  },
  stageCard: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  stageTitle: {
    fontSize: 20,
    color: '#aaa',
    marginBottom: 10,
  },
  stageHighlight: {
    color: '#9b59b6',
    fontWeight: 'bold',
    fontSize: 22,
  },
  stageDesc: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  nextStageContainer: {
    alignItems: 'center',
  },
  nextStageTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
  nextStageText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  maxStageText: {
    fontSize: 18,
    color: '#f1c40f',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  adBuffBtn: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  adBuffIdle: {
    backgroundColor: '#e67e22',
  },
  adBuffActive: {
    backgroundColor: '#27ae60',
  },
  adBuffText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  breakthroughBtn: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  breakthroughBtnActive: {
    backgroundColor: '#8e44ad',
  },
  breakthroughBtnDisabled: {
    backgroundColor: '#2c3e50',
  },
  breakthroughBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  deadText: {
    fontSize: 20,
    color: '#e74c3c',
    fontWeight: 'bold',
  }
});