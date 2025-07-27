import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SavingsTab from '../components/personal-finance/SavingsTab';
import IncomeTab from '../components/personal-finance/IncomeTab';
import PayablesTab from '../components/personal-finance/PayablesTab';
import MoneyLentTab from '../components/personal-finance/MoneyLentTab';

interface PersonalFinanceProps {
  onBack: () => void;
  token: string;
}

type TabType = 'savings' | 'income' | 'payables' | 'money-lent';

export default function PersonalFinance({ onBack, token }: PersonalFinanceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('savings');
  const insets = useSafeAreaInsets();

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
    { id: 'savings' as TabType, title: 'Savings', icon: 'savings' },
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Personal Finance
          </Text>
          <View style={styles.headerSpacer} />
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
                size={18}
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
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
    padding: 16,
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
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#2563eb',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
  },
}); 