import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AddMoneyLentPopup from './AddMoneyLentPopup';
import DatePicker from '../DatePicker';import apiClient from '../../lib/axios-config';


interface MoneyLentType {
  _id: string;
  name: string;
  totalAmount: number;
  entries: MoneyLentEntry[];
}

interface MoneyLentEntry {
  _id: string;
  date: string;
  amount: number;
  typeId: string;
}

interface MoneyLentTabProps {
  token: string;
}

export default function MoneyLentTab({ token }: MoneyLentTabProps) {
  const [moneyLentTypes, setMoneyLentTypes] = useState<MoneyLentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedType, setSelectedType] = useState<MoneyLentType | null>(null);
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchMoneyLentTypes();
  }, []);

  useEffect(() => {
    if (!showAddPopup) {
      fetchMoneyLentTypes();
    }
  }, [showAddPopup]);

  const fetchMoneyLentTypes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/money-lent-types`);
      setMoneyLentTypes(response.data);
    } catch (error) {
      console.error('Error fetching money lent types:', error);
      Alert.alert('Error', 'Failed to fetch money lent data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalMoneyLent = () => {
    return moneyLentTypes.reduce((total, type) => total + type.totalAmount, 0);
  };

  const getFilteredEntries = (entries: MoneyLentEntry[]) => {
    let filtered = [...entries];

    if (filterFromDate) {
      filtered = filtered.filter(entry => new Date(entry.date) >= filterFromDate);
    }

    if (filterToDate) {
      filtered = filtered.filter(entry => new Date(entry.date) <= filterToDate);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredTypes = () => {
    if (filterType === 'all') {
      return moneyLentTypes;
    }
    return moneyLentTypes.filter(type => type.name === filterType);
  };

  const handleTypePress = (type: MoneyLentType) => {
    setSelectedType(type);
  };

  const handleBackToList = () => {
    setSelectedType(null);
  };

  if (selectedType) {
    const filteredEntries = getFilteredEntries(selectedType.entries);
    
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedType.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Money Lent</Text>
          <Text style={styles.totalAmount}>₹{selectedType.totalAmount.toLocaleString()}</Text>
        </View>

        {/* Date Filters */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Date Range:</Text>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement date picker
                Alert.alert('Date Picker', 'Date picker functionality will be implemented');
              }}
              style={styles.dateFilterButton}
            >
              <Text style={styles.dateFilterLabel}>From Date</Text>
              <Text style={styles.dateFilterValue}>
                {filterFromDate ? filterFromDate.toLocaleDateString() : 'Select'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement date picker
                Alert.alert('Date Picker', 'Date picker functionality will be implemented');
              }}
              style={styles.dateFilterButton}
            >
              <Text style={styles.dateFilterLabel}>To Date</Text>
              <Text style={styles.dateFilterValue}>
                {filterToDate ? filterToDate.toLocaleDateString() : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entries List */}
        <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No entries found</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <View key={entry._id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {new Date(entry.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.entryAmount}>₹{entry.amount.toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total Money Lent */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Money Lent</Text>
        <Text style={styles.totalAmount}>₹{getTotalMoneyLent().toLocaleString()}</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddPopup(true)}
        style={styles.addButton}
      >
        <MaterialIcons name="add" size={24} color="#ffffff" />
        <Text style={styles.addButtonText}>Add New</Text>
      </TouchableOpacity>

      {/* Money Lent Types */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading money lent...</Text>
        </View>
      ) : moneyLentTypes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No money lent types found</Text>
        </View>
      ) : (
        <ScrollView style={styles.typesList} showsVerticalScrollIndicator={false}>
          {getFilteredTypes().map((type) => (
            <TouchableOpacity
              key={type._id}
              onPress={() => handleTypePress(type)}
              style={styles.typeCard}
            >
              <View style={styles.typeContent}>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeAmount}>₹{type.totalAmount.toLocaleString()}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add Money Lent Popup */}
      {showAddPopup && (
        <AddMoneyLentPopup
          token={token}
          onClose={() => setShowAddPopup(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#7c3aed',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  typesList: {
    flex: 1,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  typeContent: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  typeAmount: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateFilterButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateFilterLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateFilterValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  entriesList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  typeFilterScroll: {
    flexDirection: 'row',
  },
  typeFilterChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeTypeFilterChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeFilterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTypeFilterChipText: {
    color: '#ffffff',
  },
}); 