import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import apiClient from '../../lib/axios-config';
import AddCustomerPopup from '../components/AddCustomerPopup';
import DeleteAuthPopup from '../components/DeleteAuthPopup';
import DatePicker from '../components/DatePicker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Customer {
  _id: string;
  name: string;
  contact: string;
  credit: number;
  joinDate: string;
}

interface CustomersProps {
  onBack: () => void;
  token: string;
}

export default function Customers({ onBack, token }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact: '',
    credit: '',
    joinDate: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddCustomerPopup, setShowAddCustomerPopup] = useState(false);
  const [showDeleteAuthPopup, setShowDeleteAuthPopup] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const insets = useSafeAreaInsets();

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (editingCustomer) {
        setEditingCustomer(null);
        return true;
      }
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [editingCustomer, onBack]);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/customers`);
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort customers
  useEffect(() => {
    let filtered = customers.filter(customer => {
      const query = searchQuery.toLowerCase();
      return customer.name.toLowerCase().includes(query) || 
             customer.contact.toLowerCase().includes(query);
    });

    // Sort customers by join date
    filtered.sort((a, b) => {
      const dateA = new Date(a.joinDate).getTime();
      const dateB = new Date(b.joinDate).getTime();
      return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, sortOrder]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      contact: customer.contact,
      credit: customer.credit.toString(),
      joinDate: customer.joinDate
    });
  };

  const handleUpdate = async () => {
    if (!editingCustomer || isUpdating) return;

    setIsUpdating(true);
    try {
      await apiClient.put(
        `/api/customers/${editingCustomer._id}`,
        editForm
      );
      Alert.alert('Success', 'Customer updated successfully');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadCustomers = async () => {
    if (!customers.length) return;
    const data = customers.map(c => ({
      Name: c.name,
      Contact: c.contact,
      Credit: c.credit,
      'Join Date': new Date(c.joinDate).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'customers.xlsx';
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Download Customers' });
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteAuthPopup(true);
  };

  const handleDeleteConfirm = async (mobile: string, password: string) => {
    if (!customerToDelete) return;

    try {
      await apiClient.delete(`/api/customers/${customerToDelete._id}`, {
        headers: { Authorization: token },
        data: { mobile, password }
      });
      Alert.alert('Success', 'Customer deleted successfully');
      setShowDeleteAuthPopup(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Invalid credentials. Deletion denied.');
      } else {
        Alert.alert('Error', 'Failed to delete customer');
      }
      setShowDeleteAuthPopup(false);
      setCustomerToDelete(null);
    }
  };

  if (editingCustomer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => setEditingCustomer(null)}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Customer</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Edit Form */}
          <View style={styles.editForm}>
            <TextInput
              placeholder="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Contact"
              value={editForm.contact}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, contact: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Credit"
              value={editForm.credit}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, credit: text }))}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Join Date</Text>
              <DatePicker
                value={new Date(editForm.joinDate)}
                onDateChange={(selectedDate) => {
                  if (selectedDate) {
                    setEditForm(prev => ({ 
                      ...prev, 
                      joinDate: selectedDate.toISOString().split('T')[0] 
                    }));
                  }
                }}
                placeholder="Select Join Date"
                style={styles.datePicker}
              />
            </View>
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={isUpdating}
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
            >
              <Text style={styles.updateButtonText}>
                {isUpdating ? 'Updating...' : 'Update Customer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </Pressable>
          <Text style={styles.headerTitle}>Customers</Text>
          <TouchableOpacity
            onPress={handleDownloadCustomers}
            style={styles.downloadButton}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Search and Sort Bar */}
        <View style={styles.searchSortContainer}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or contact..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialIcons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === 'oldest' ? 'newest' : 'oldest')}
          >
            <MaterialIcons 
              name={sortOrder === 'oldest' ? 'sort-by-alpha' : 'sort-by-alpha'} 
              size={20} 
              color="#2563eb" 
            />
            <Text style={styles.sortButtonText}>
              {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No customers found matching your search' : 'No customers found'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {filteredCustomers.map((customer) => (
              <View
                key={customer._id}
                style={styles.customerCard}
              >
                <View style={styles.customerCardContent}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>
                      {customer.name}
                    </Text>
                    <View style={styles.customerDetails}>
                      <Text style={styles.customerDetailText}>Contact: {customer.contact}</Text>
                      <Text style={styles.customerDetailText}>Credit: ₹{customer.credit}</Text>
                      <Text style={styles.customerDetailText}>Joined: {new Date(customer.joinDate).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => handleEdit(customer)}
                      style={styles.editButton}
                    >
                      <MaterialIcons name="edit" size={18} color="#2563EB" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(customer)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add Customer Popup */}
      {showAddCustomerPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowAddCustomerPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}

      {/* Delete Authentication Popup */}
      {showDeleteAuthPopup && customerToDelete && (
        <DeleteAuthPopup
          onClose={() => {
            setShowDeleteAuthPopup(false);
            setCustomerToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Customer"
          message={`Are you sure you want to delete "${customerToDelete.name}"? Please enter your credentials to confirm.`}
        />
      )}

      {/* Add Button */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 12, alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2563eb',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.10,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => setShowAddCustomerPopup(true)}
        >
          <MaterialIcons name="person-add" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Customer</Text>
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
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  },
  headerSpacer: {
    width: 40,
  },
  downloadButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  // Edit Form Styles
  editForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 16,
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  // Customer List Styles
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 18,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 18,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  customerDetails: {
    gap: 4,
  },
  customerDetailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },
  // Search and Sort Styles
  searchSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  // Edit Form Additional Styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  datePicker: {
    marginBottom: 0,
  },
});
