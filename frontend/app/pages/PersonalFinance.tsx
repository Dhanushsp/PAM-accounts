import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import SavingsTab from '../components/personal-finance/SavingsTab';
import IncomeTab from '../components/personal-finance/IncomeTab';
import PayablesTab from '../components/personal-finance/PayablesTab';
import MoneyLentTab from '../components/personal-finance/MoneyLentTab';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PersonalFinanceProps {
  onBack: () => void;
  token: string;
}

type TabType = 'savings' | 'income' | 'payables' | 'money-lent';

export default function PersonalFinance({ onBack, token }: PersonalFinanceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('savings');
  const insets = useSafeAreaInsets();
  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const tabs = [
    { id: 'savings' as TabType, title: 'Savings', icon: 'account-balance-wallet' },
    { id: 'income' as TabType, title: 'Income', icon: 'trending-up' },
    { id: 'payables' as TabType, title: 'Payables', icon: 'payment' },
    { id: 'money-lent' as TabType, title: 'Money Lent', icon: 'account-balance' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'savings':
        return <SavingsTab token={token} />;
      case 'income':
        return <IncomeTab token={token} />;
      case 'payables':
        return <PayablesTab token={token} />;
      case 'money-lent':
        return <MoneyLentTab token={token} />;
      default:
        return <SavingsTab token={token} />;
    }
  };

  const handleDownloadPersonalFinance = async () => {
    try {
      // Fetch all data for personal finance
      const [savingsResponse, incomeResponse, payablesResponse, moneyLentResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/savings-types`, { headers: { Authorization: token } }),
        axios.get(`${BACKEND_URL}/api/income-types`, { headers: { Authorization: token } }),
        axios.get(`${BACKEND_URL}/api/payable-types`, { headers: { Authorization: token } }),
        axios.get(`${BACKEND_URL}/api/money-lent-types`, { headers: { Authorization: token } })
      ]);

      const wb = XLSX.utils.book_new();

      // Savings sheet
      if (savingsResponse.data.length > 0) {
        const savingsData = savingsResponse.data.map((s: any) => ({
          'Savings Type': s.name,
          'Total Amount': s.totalAmount,
          'Entries Count': s.entries?.length || 0
        }));
        const savingsWs = XLSX.utils.json_to_sheet(savingsData);
        XLSX.utils.book_append_sheet(wb, savingsWs, 'Savings');
      }

      // Income sheet
      if (incomeResponse.data.length > 0) {
        const incomeData = incomeResponse.data.map((i: any) => ({
          'Income Type': i.name,
          'Total Amount': i.totalAmount,
          'Entries Count': i.entries?.length || 0
        }));
        const incomeWs = XLSX.utils.json_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, incomeWs, 'Income');
      }

      // Payables sheet
      if (payablesResponse.data.length > 0) {
        const payablesData = payablesResponse.data.map((p: any) => ({
          'Payable Type': p.name,
          'Total Amount': p.totalAmount,
          'Entries Count': p.entries?.length || 0
        }));
        const payablesWs = XLSX.utils.json_to_sheet(payablesData);
        XLSX.utils.book_append_sheet(wb, payablesWs, 'Payables');
      }

      // Money Lent sheet
      if (moneyLentResponse.data.length > 0) {
        const moneyLentData = moneyLentResponse.data.map((m: any) => ({
          'Money Lent Type': m.name,
          'Total Amount': m.totalAmount,
          'Entries Count': m.entries?.length || 0
        }));
        const moneyLentWs = XLSX.utils.json_to_sheet(moneyLentData);
        XLSX.utils.book_append_sheet(wb, moneyLentWs, 'Money Lent');
      }

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'personal_finance.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        dialogTitle: 'Download Personal Finance Data' 
      });
    } catch (error) {
      console.error('Error downloading personal finance data:', error);
      Alert.alert('Error', 'Failed to download personal finance data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Personal Finance
          </Text>
          <TouchableOpacity
            onPress={handleDownloadPersonalFinance}
            style={styles.downloadButton}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.id ? '#ffffff' : '#6b7280'}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF', // equivalent to bg-blue-50
  },
  content: {
    flex: 1,
    padding: 12,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 0,
  },
  activeTabButton: {
    backgroundColor: '#2563eb',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 14,
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
  },
  downloadButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
}); 