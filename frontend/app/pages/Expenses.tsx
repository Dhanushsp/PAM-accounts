import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ExpenseStats from '../components/ExpenseStats';

interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  description?: string;
  photo?: string;
}

interface ExpensesProps {
  token: string;
  onBack: () => void;
}

export default function Expenses({ token, onBack }: ExpensesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'expenses' | 'stats'>('expenses');
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/expenses`, {
        headers: { Authorization: token },
      });
      const data = await response.json();
      setExpenses(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((expense: Expense) => expense.category))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filteredExpenses = selectedCategory === 'all' 
    ? expenses 
    : expenses.filter(expense => expense.category === selectedCategory);

  // Group expenses by date
  const groupedExpenses = filteredExpenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
    const date = new Date(expense.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const renderDateGroup = ({ item: date }: { item: string }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{date}</Text>
      <View style={styles.dateExpenses}>
        {groupedExpenses[date].map((expense) => (
          <View key={expense._id} style={styles.expenseItem}>
            <View style={styles.expenseHeader}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseSubcategory}>{expense.subcategory}</Text>
                {expense.description && <Text style={styles.expenseDescription}>{expense.description}</Text>}
              </View>
              <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (currentView === 'stats') {
    return <ExpenseStats expenses={expenses} onBack={() => setCurrentView('expenses')} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-4">
        {/* Modernized Header */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1" style={{ elevation: 3 }}>
          <TouchableOpacity
            onPress={onBack}
            className="bg-gray-100 rounded-full p-2"
            style={{ elevation: 2 }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center" style={{ letterSpacing: 1 }}>
            Expenses
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>
          <FlatList
            horizontal
            data={['all', ...categories]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedCategory === item && styles.filterButtonActive
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedCategory === item && styles.filterButtonTextActive
                ]}>
                  {item === 'all' ? 'All' : item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          />
        </View>

        {/* Expenses List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Loading expenses...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">No expenses found</Text>
          </View>
        ) : (
          <FlatList
            data={sortedDates}
            keyExtractor={(item) => item}
            renderItem={renderDateGroup}
            ListEmptyComponent={<Text style={styles.emptyText}>No expenses found.</Text>}
            contentContainerStyle={styles.expenseList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonActive]} 
          onPress={() => setCurrentView('expenses')}
        >
          <MaterialIcons name="receipt" size={20} color="#2563eb" />
          <Text style={styles.navButtonTextActive}>All Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setCurrentView('stats')}
        >
          <MaterialIcons name="bar-chart" size={20} color="#64748b" />
          <Text style={styles.navButtonText}>Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  filterList: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  expenseList: {
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateExpenses: {
    gap: 8,
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseSubcategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  navButtonActive: {
    backgroundColor: '#eff6ff',
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  navButtonTextActive: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
}); 