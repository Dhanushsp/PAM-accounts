import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ExpenseStats from '../components/ExpenseStats';
import EditExpense from '../components/EditExpense';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiClient from '../../lib/axios-config';


interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  description: string;
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
  const [filterType, setFilterType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Edit states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const insets = useSafeAreaInsets();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/expenses`);
      setExpenses(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map((expense: Expense) => expense.category))] as string[];
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

  // Grouping logic
  let groupedExpenses: { [key: string]: Expense[] | { total: number, items: Expense[] } } = {};
  let sortedKeys: string[] = [];

  if (filterType === 'daily') {
    groupedExpenses = filteredExpenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
      const date = new Date(expense.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(expense);
      return groups;
    }, {});
    sortedKeys = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  } else if (filterType === 'monthly') {
    groupedExpenses = filteredExpenses.reduce((groups: { [key: string]: { total: number, items: Expense[] } }, expense) => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!groups[key]) groups[key] = { total: 0, items: [] };
      groups[key].total += expense.amount;
      groups[key].items.push(expense);
      return groups;
    }, {});
    sortedKeys = Object.keys(groupedExpenses).sort((a, b) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return by !== ay ? by - ay : bm - am;
    });
  } else if (filterType === 'yearly') {
    groupedExpenses = filteredExpenses.reduce((groups: { [key: string]: { total: number, items: Expense[] } }, expense) => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}`;
      if (!groups[key]) groups[key] = { total: 0, items: [] };
      groups[key].total += expense.amount;
      groups[key].items.push(expense);
      return groups;
    }, {});
    sortedKeys = Object.keys(groupedExpenses).sort((a, b) => Number(b) - Number(a));
  }

  const renderDateGroup = ({ item: date }: { item: string }) => {
    const expenses = groupedExpenses[date];
    if (Array.isArray(expenses)) {
      return (
        <View style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{date}</Text>
          <View style={styles.dateExpenses}>
            {expenses.map((expense) => (
              <View key={expense._id} style={styles.expenseItem}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    <Text style={styles.expenseSubcategory}>{expense.subcategory}</Text>
                    {expense.description && <Text style={styles.expenseDescription}>{expense.description}</Text>}
                  </View>
                  <View style={styles.expenseActions}>
                    <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
                    <TouchableOpacity
                      onPress={() => handleEditExpense(expense)}
                      style={styles.editButton}
                    >
                      <MaterialIcons name="edit" size={16} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(expense)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  const handleDownloadExpenses = async () => {
    if (!expenses.length) return;
    const data = expenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Category: e.category,
      Subcategory: e.subcategory,
      Amount: e.amount,
      Description: e.description || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'expenses.xlsx';
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Download Expenses' });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/expenses/${expense._id}`);
              Alert.alert('Success', 'Expense deleted successfully');
              fetchExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const handleExpenseUpdated = () => {
    setShowEditModal(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  if (currentView === 'stats') {
    return <ExpenseStats expenses={expenses} onBack={() => setCurrentView('expenses')} />;
  }

  const filterOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Modernized Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.title}>Expenses</Text>
          {/* Filter Dropdown */}
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterDropdown}>
            <Text style={styles.filterDropdownText}>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#2563eb" style={styles.filterDropdownIcon} />
          </TouchableOpacity>
          <View style={{ width: 8 }} />
        </View>
        <Modal visible={showFilterModal} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
            <View style={styles.filterModal}>
              {filterOptions.map(opt => (
                <TouchableOpacity key={opt.value} onPress={() => { setFilterType(opt.value as any); setShowFilterModal(false); }} style={styles.filterOption}>
                  <Text style={[styles.filterOptionText, filterType === opt.value && styles.filterOptionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Category Filter */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
          <TouchableOpacity
            onPress={handleDownloadExpenses}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 }}
          >
            <MaterialIcons name="download" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Download Expenses</Text>
          </TouchableOpacity>
        </View>

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
          filterType === 'daily' ? (
            <FlatList
              data={sortedKeys}
              keyExtractor={(item) => item}
              renderItem={renderDateGroup}
              ListEmptyComponent={<Text style={styles.emptyText}>No expenses found.</Text>}
              contentContainerStyle={styles.expenseList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={sortedKeys}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.summaryGroup}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryPeriod}>
                      {filterType === 'monthly' 
                        ? `${new Date(parseInt(item.split('-')[0]), parseInt(item.split('-')[1]) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
                        : `${item}`
                      }
                    </Text>
                    <Text style={styles.summaryTotal}>₹{(groupedExpenses as any)[item].total.toLocaleString()}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No expenses found.</Text>}
              contentContainerStyle={styles.expenseList}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <EditExpense
          expense={editingExpense}
          token={token}
          onClose={() => {
            setShowEditModal(false);
            setEditingExpense(null);
          }}
          onExpenseUpdated={handleExpenseUpdated}
        />
      )}

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
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF', // equivalent to bg-blue-50
  },
  content: {
    flex: 1,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
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
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#fef3f2',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    flex: 1,
    textAlign: 'center',
  },
  filterDropdown: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  filterDropdownText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterDropdownIcon: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  filterModal: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 100,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterOptionText: {
    color: '#374151',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  summaryGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
}); 