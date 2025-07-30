import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DatePicker from './DatePicker';

interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

interface CategoryStats {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface ExpenseStatsProps {
  expenses: Expense[];
  onBack: () => void;
}

type TabType = 'all' | 'stats';

export default function ExpenseStats({ expenses, onBack }: ExpenseStatsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const insets = useSafeAreaInsets();

  const getFilteredExpenses = () => {
    let filtered = [...expenses];

    // Filter by date range
    if (filterFromDate) {
      const fromDateStart = new Date(filterFromDate);
      fromDateStart.setHours(0, 0, 0, 0);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate >= fromDateStart;
      });
    }

    if (filterToDate) {
      const toDateEnd = new Date(filterToDate);
      toDateEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate <= toDateEnd;
      });
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCategoryStats = () => {
    const filteredExpenses = getFilteredExpenses();
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryMap = new Map<string, number>();
    filteredExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      total: amount,
      count: filteredExpenses.filter(e => e.category === category).length,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }));

    return stats.sort((a, b) => b.total - a.total);
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    expenses.forEach(expense => categories.add(expense.category));
    return Array.from(categories);
  };

  const getTotalAmount = () => {
    return getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  };

  const renderAllExpenses = () => {
    const filteredExpenses = getFilteredExpenses();
    
    return (
      <View style={styles.tabContent}>
        {/* Date Filters */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Date Range:</Text>
          <View style={styles.dateFilterRow}>
            <DatePicker
              value={filterFromDate}
              onDateChange={setFilterFromDate}
              placeholder="From Date"
              style={{ flex: 1, marginRight: 6 }}
            />
            <DatePicker
              value={filterToDate}
              onDateChange={setFilterToDate}
              placeholder="To Date"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterScroll}>
            <TouchableOpacity
              style={[styles.categoryFilterChip, filterCategory === 'all' && styles.activeCategoryFilterChip]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[styles.categoryFilterChipText, filterCategory === 'all' && styles.activeCategoryFilterChipText]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {getUniqueCategories().map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryFilterChip, filterCategory === category && styles.activeCategoryFilterChip]}
                onPress={() => setFilterCategory(category)}
              >
                <Text style={[styles.categoryFilterChipText, filterCategory === category && styles.activeCategoryFilterChipText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalAmount}>₹{getTotalAmount().toLocaleString()}</Text>
        </View>

        {/* Expenses List */}
        <ScrollView style={styles.expensesList} showsVerticalScrollIndicator={false}>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          ) : (
            filteredExpenses.map((expense) => (
              <View key={expense._id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString()}</Text>
                </View>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderStats = () => {
    const categoryStats = getCategoryStats();
    const totalAmount = getTotalAmount();
    
    return (
      <View style={styles.tabContent}>
        {/* Date Filters */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Date Range:</Text>
          <View style={styles.dateFilterRow}>
            <DatePicker
              value={filterFromDate}
              onDateChange={setFilterFromDate}
              placeholder="From Date"
              style={{ flex: 1, marginRight: 6 }}
            />
            <DatePicker
              value={filterToDate}
              onDateChange={setFilterToDate}
              placeholder="To Date"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterScroll}>
            <TouchableOpacity
              style={[styles.categoryFilterChip, filterCategory === 'all' && styles.activeCategoryFilterChip]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[styles.categoryFilterChipText, filterCategory === 'all' && styles.activeCategoryFilterChipText]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {getUniqueCategories().map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryFilterChip, filterCategory === category && styles.activeCategoryFilterChip]}
                onPress={() => setFilterCategory(category)}
              >
                <Text style={[styles.categoryFilterChipText, filterCategory === category && styles.activeCategoryFilterChipText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Category Statistics */}
        <ScrollView style={styles.statsList} showsVerticalScrollIndicator={false}>
          {categoryStats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No statistics available</Text>
            </View>
          ) : (
            categoryStats.map((stat, index) => (
              <View key={stat.category} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statCategory}>{stat.category}</Text>
                  <Text style={styles.statAmount}>₹{stat.total.toLocaleString()}</Text>
                </View>
                <View style={styles.statDetails}>
                  <Text style={styles.statCount}>{stat.count} expenses</Text>
                  <Text style={styles.statPercentage}>{stat.percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${stat.percentage}%` }
                    ]} 
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Statistics</Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => setActiveTab('all')}
        >
          <MaterialIcons
            name="list"
            size={16}
            color={activeTab === 'all' ? '#ffffff' : '#6b7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stats' && styles.activeTabButton]}
          onPress={() => setActiveTab('stats')}
        >
          <MaterialIcons
            name="bar-chart"
            size={16}
            color={activeTab === 'stats' ? '#ffffff' : '#6b7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'all' ? renderAllExpenses() : renderStats()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF', // blue-50
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
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
    marginBottom: 16,
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
  filterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryFilterScroll: {
    flexDirection: 'row',
  },
  categoryFilterChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeCategoryFilterChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryFilterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeCategoryFilterChipText: {
    color: '#ffffff',
  },
  totalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626', // red-600
  },
  expensesList: {
    flex: 1,
  },
  statsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  statDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  statPercentage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
}); 