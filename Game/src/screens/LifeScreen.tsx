import React, { useEffect } from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';

import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
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

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const { locale, setLocale } = useLocaleStore();

  const eventsData = locale === 'ru' ? ruEvents : enEvents;
  const uiData = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;

  useEffect(() => {
    if (player.age === 0 && player.money === "0" && player.health === 100 && player.qi === "0" && !player.isDead) {
      player.reincarnate();
      addLog(uiData.born_log, "system");
    }
  }, []);

  useEffect(() => {
    if (player.isDead) {
      addLog(uiData.death_log, "system");
    }
  }, [player.isDead]);

  const handleGrowOlder = () => {
    const now = Date.now();
    
    // Проверка жесткого кулдауна межстраничной рекламы (70 секунд)
    if (!player.hasCultivatorPass) {
      if (now - player.lastInterstitialTime > 70000) {
        player.setLastInterstitialTime(now);
        addLog(uiData.interstitial_log, "system");
        // Здесь в будущем будет вызов реального SDK рекламы (AdMob/AppLovin)
      }
    }

    player.growOlder();
    
    let secretEventChance = 0.1; 
    
    if (player.activityFocus === 'secret') {
      secretEventChance = 0.8; 
      player.addQi(player.spiritualRoot.toString());
      addLog(uiData.meditation_log.replace('{amount}', player.spiritualRoot.toString()), 'secret');
    }

    const isSecretEvent = secretEventChance > Math.random();
    const eventPool = isSecretEvent ? eventsData.secret : eventsData.mundane;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    player.applyEffects(randomEvent.effects);
    
    const ageString = uiData.age_log.replace('{age}', (player.age + 1).toString());
    addLog(`${ageString} ${randomEvent.text}`, isSecretEvent ? 'secret' : 'mundane');
  };

  const handleReincarnate = () => {
    player.reincarnate();
    addLog(uiData.reincarnate_log, "system");
  };

  const toggleLocale = () => {
    setLocale(locale === 'ru' ? 'en' : 'ru');
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={toggleLocale} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{locale.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.deadContainer}>
          <Text style={styles.deadTitle}>{uiData.dead_title}</Text>
          <Text style={styles.deadSubtitle}>{uiData.dead_subtitle}</Text>
          
          <View style={styles.karmaBlock}>
            <Text style={styles.legacyText}>
              {uiData.karma_earned_last_life} <Text style={styles.karmaHighlight}>+{formatLargeNumber(player.lastLifeKarmaEarned)}</Text>
            </Text>
            <Text style={styles.karmaText}>
              {uiData.karma_accumulated} {formatLargeNumber(player.karma)}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button 
              title={uiData.btn_reincarnate} 
              color="#e74c3c"
              onPress={handleReincarnate} 
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{uiData.title}</Text>
          <TouchableOpacity onPress={toggleLocale} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{locale.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statText}>{uiData.age}: {player.age}</Text>
          <Text style={styles.statText}>{uiData.health}: {player.health}</Text>
          <Text style={styles.statText}>{uiData.intelligence}: {player.intelligence}</Text>
          <Text style={styles.statText}>{uiData.appearance}: {player.appearance}</Text>
          <Text style={styles.statText}>{uiData.money}: ${formatLargeNumber(player.money)}</Text>
          <Text style={styles.statText}>{uiData.spiritual_root}: {player.spiritualRoot}</Text>
          <Text style={styles.statText}>{uiData.qi}: {formatLargeNumber(player.qi)}</Text>
          <Text style={styles.statText}>{uiData.karma}: {formatLargeNumber(player.karma)}</Text>
        </View>
        
        <View style={styles.focusContainer}>
          <Text style={styles.focusTitle}>{uiData.focus_title}</Text>
          <View style={styles.focusButtons}>
            <TouchableOpacity 
              style={[styles.focusBtn, player.activityFocus === 'mundane' && styles.focusBtnActive]}
              onPress={() => player.setActivityFocus('mundane')}
            >
              <Text style={[styles.focusBtnText, player.activityFocus === 'mundane' && styles.focusBtnTextActive]}>
                {uiData.focus_mundane}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.focusBtn, player.activityFocus === 'secret' && styles.focusBtnActive]}
              onPress={() => player.setActivityFocus('secret')}
            >
              <Text style={[styles.focusBtnText, player.activityFocus === 'secret' && styles.focusBtnTextActive]}>
                {uiData.focus_secret}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title={uiData.btn_grow} onPress={handleGrowOlder} />
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  langBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  langBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deadTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  deadSubtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 30,
  },
  karmaBlock: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  karmaText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1c40f',
    marginTop: 15,
  },
  legacyText: {
    fontSize: 16,
    color: '#ddd',
  },
  karmaHighlight: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  statText: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 8,
  },
  focusContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  focusTitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  focusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
  },
  focusBtnActive: {
    backgroundColor: '#3498db',
  },
  focusBtnText: {
    color: '#888',
    fontWeight: 'bold',
  },
  focusBtnTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 10,
    marginBottom: 30,
  }
});