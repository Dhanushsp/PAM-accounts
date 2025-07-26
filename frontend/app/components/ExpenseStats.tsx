import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  description?: string;
  photo?: string;
}

interface ExpenseStatsProps {
  expenses: Expense[];
  onBack: () => void;
}

interface CategoryStats {
  category: string;
  totalAmount: number;
  percentage: number;
  count: number;
}

export default function ExpenseStats({ expenses, onBack }: ExpenseStatsProps) {
  // Calculate total spending
  const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Group expenses by category and calculate stats
  const categoryStats: CategoryStats[] = expenses.reduce((stats: CategoryStats[], expense) => {
    const existingCategory = stats.find(stat => stat.category === expense.category);
    
    if (existingCategory) {
      existingCategory.totalAmount += expense.amount;
      existingCategory.count += 1;
    } else {
      stats.push({
        category: expense.category,
        totalAmount: expense.amount,
        percentage: 0,
        count: 1
      });
    }
    
    return stats;
  }, []);

  // Calculate percentages and sort by total amount (descending)
  const sortedStats = categoryStats
    .map(stat => ({
      ...stat,
      percentage: totalSpending > 0 ? (stat.totalAmount / totalSpending) * 100 : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const renderCategoryStat = ({ item }: { item: CategoryStats }) => (
    <View style={styles.categoryStat}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.category}</Text>
        <Text style={styles.categoryAmount}>₹{item.totalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.categoryDetails}>
        <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
        <Text style={styles.categoryCount}>{item.count} expense{item.count !== 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${Math.min(item.percentage, 100)}%` }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Expense Statistics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Total Spending</Text>
        <Text style={styles.totalAmount}>₹{totalSpending.toFixed(2)}</Text>
        <Text style={styles.summarySubtitle}>
          Across {expenses.length} expense{expenses.length !== 1 ? 's' : ''} in {categoryStats.length} categor{categoryStats.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <FlatList
        data={sortedStats}
        keyExtractor={(item) => item.category}
        renderItem={renderCategoryStat}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bar-chart" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No expenses to analyze</Text>
          </View>
        }
        contentContainerStyle={styles.statsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  summaryContainer: {
    backgroundColor: '#eff6ff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsList: {
    padding: 16,
  },
  categoryStat: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
}); 