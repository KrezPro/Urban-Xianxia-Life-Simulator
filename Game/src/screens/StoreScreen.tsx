import React from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useLocaleStore } from '../store/useLocaleStore';
import itemsData from '../data/items.json';

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

export default function StoreScreen() {
  const player = usePlayerStore();
  const inventory = useInventoryStore();
  const locale = useLocaleStore(state => state.locale);
  
  const uiData = locale === 'ru' ? ruUI.store_screen : enUI.store_screen;
  
  const handleBuy = (item: any) => {
    const costBig = BigInt(item.cost);
    const karmaBig = BigInt(player.karma);
    
    if (karmaBig >= costBig && !inventory.items[item.id]) {
      player.deductKarma(item.cost);
      inventory.addItem({ id: item.id, quantity: 1, type: item.type } as any);
    }
  };

  const handleBuyPass = () => {
    // В будущем здесь будет обработчик встроенных покупок (Expo In-App Purchases)
    player.setCultivatorPass(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{uiData.title}</Text>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>
            {uiData.karma_balance} <Text style={styles.karmaHighlight}>{formatLargeNumber(player.karma)}</Text>
          </Text>
        </View>

        {itemsData.filter(i => i.type === 'karma_buff').map((item) => {
          const isBought = !!inventory.items[item.id];
          const costBig = BigInt(item.cost);
          const karmaBig = BigInt(player.karma);
          const canAfford = karmaBig >= costBig;
          
          const itemUI = (uiData.items as any)[item.id] || { name: item.id, desc: '' };

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{itemUI.name}</Text>
                <Text style={styles.itemDesc}>{itemUI.desc}</Text>
                <Text style={styles.itemCost}>{uiData.cost} {formatLargeNumber(item.cost)}</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.buyBtn, 
                  isBought ? styles.btnBought : (!canAfford ? styles.btnDisabled : styles.btnActive)
                ]}
                onPress={() => handleBuy(item)}
                disabled={isBought || !canAfford}
              >
                <Text style={styles.buyBtnText}>
                  {isBought ? uiData.btn_bought : (!canAfford ? uiData.btn_no_karma : uiData.btn_buy)}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{uiData.iap_section}</Text>

        <View style={styles.iapCard}>
          <Text style={styles.iapName}>{uiData.iap_pass}</Text>
          <Text style={styles.itemDesc}>{uiData.iap_pass_desc}</Text>
          <TouchableOpacity 
            style={[styles.iapBtn, player.hasCultivatorPass ? styles.btnBought : styles.btnActive]} 
            onPress={handleBuyPass}
            disabled={player.hasCultivatorPass}
          >
            <Text style={styles.buyBtnText}>
              {player.hasCultivatorPass ? uiData.btn_iap_active : uiData.btn_iap_buy}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.iapCard}>
          <Text style={styles.iapName}>{uiData.iap_ad}</Text>
          <Text style={styles.itemDesc}>{uiData.iap_ad_desc}</Text>
          <TouchableOpacity style={[styles.iapBtn, styles.btnDisabled]} disabled>
            <Text style={styles.buyBtnText}>INFO ONLY</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 1,
  },
  balanceContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f1c40f',
  },
  balanceText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  karmaHighlight: {
    color: '#f1c40f',
    fontSize: 22,
  },
  itemCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  itemDesc: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  itemCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1c40f',
  },
  buyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#2ecc71',
  },
  btnDisabled: {
    backgroundColor: '#7f8c8d',
  },
  btnBought: {
    backgroundColor: '#9b59b6',
  },
  buyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginVertical: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  iapCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  iapName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  iapBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
});