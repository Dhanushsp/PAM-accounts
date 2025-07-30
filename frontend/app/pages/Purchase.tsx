import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import DatePicker from '../components/DatePicker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AddVendorPopup from '../components/AddVendorPopup';
import AddPurchasePopup from '../components/AddPurchasePopup';

interface Vendor {
  _id: string;
  name: string;
  contact: string;
  credit: number;
  items: string[];
}

interface Purchase {
  _id: string;
  item: string;
  vendor: string;
  vendorName: string;
  quantity: number;
  unit: 'packs' | 'kgs';
  pricePerUnit: number;
  totalPrice: number;
  amountPaid: number;
  updatedCredit: number;
  date: string;
}

interface PurchaseProps {
  onBack: () => void;
  token: string;
}

export default function Purchase({ onBack, token }: PurchaseProps) {
  const [activeTab, setActiveTab] = useState<'vendor' | 'purchases'>('vendor');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVendorPopup, setShowAddVendorPopup] = useState(false);
  const [showAddPurchasePopup, setShowAddPurchasePopup] = useState(false);
  const [filterItem, setFilterItem] = useState('all');
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
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

  // Fetch data
  useEffect(() => {
    fetchVendors();
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (!showAddVendorPopup) {
      fetchVendors();
    }
  }, [showAddVendorPopup]);

  useEffect(() => {
    if (!showAddPurchasePopup) {
      fetchPurchases();
    }
  }, [showAddPurchasePopup]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/vendors`, {
        headers: { Authorization: token }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/purchases`, {
        headers: { Authorization: token }
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      Alert.alert('Error', 'Failed to fetch purchases');
    }
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to delete "${vendor.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/vendors/${vendor._id}`, {
                headers: { Authorization: token }
              });
              Alert.alert('Success', 'Vendor deleted successfully');
              fetchVendors();
            } catch (error) {
              console.error('Error deleting vendor:', error);
              Alert.alert('Error', 'Failed to delete vendor');
            }
          }
        }
      ]
    );
  };

  const getFilteredPurchases = () => {
    let filtered = [...purchases];

    if (filterItem !== 'all') {
      filtered = filtered.filter(p => p.item === filterItem);
    }

    if (filterFromDate) {
      filtered = filtered.filter(p => new Date(p.date) >= filterFromDate);
    }

    if (filterToDate) {
      filtered = filtered.filter(p => new Date(p.date) <= filterToDate);
    }

    return filtered;
  };

  const getUniqueItems = () => {
    const items = new Set<string>();
    purchases.forEach(p => items.add(p.item));
    return Array.from(items);
  };

  const handleDownloadData = async () => {
    if (vendors.length === 0 && purchases.length === 0) {
      Alert.alert('No Data', 'No vendors or purchases data available to download.');
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Vendors sheet
      if (vendors.length > 0) {
        const vendorsData = vendors.map(v => ({
          'Vendor Name': v.name,
          'Contact': v.contact,
          'Credit': v.credit,
          'Items': v.items.join(', '),
        }));
        const vendorsWs = XLSX.utils.json_to_sheet(vendorsData);
        XLSX.utils.book_append_sheet(wb, vendorsWs, 'Vendors');
      }
      
      // Purchases sheet
      if (purchases.length > 0) {
        const purchasesData = purchases.map(p => ({
          'Date': new Date(p.date).toLocaleDateString(),
          'Item': p.item,
          'Vendor': p.vendorName,
          'Quantity': p.quantity,
          'Unit': p.unit,
          'Price per Unit': p.pricePerUnit,
          'Total Price': p.totalPrice,
          'Amount Paid': p.amountPaid,
          'Updated Credit': p.updatedCredit,
        }));
        const purchasesWs = XLSX.utils.json_to_sheet(purchasesData);
        XLSX.utils.book_append_sheet(wb, purchasesWs, 'Purchases');
      }
      
      // Generate and share file
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'purchase_data.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        dialogTitle: 'Download Purchase Data' 
      });
    } catch (error) {
      console.error('Error downloading data:', error);
      Alert.alert('Error', 'Failed to download data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </Pressable>
          <Text style={styles.headerTitle}>
            Purchase Management
          </Text>
          <TouchableOpacity
            onPress={handleDownloadData}
            style={styles.downloadButton}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('vendor')}
            style={[styles.tabButton, activeTab === 'vendor' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'vendor' && styles.activeTabText]}>
              Vendors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('purchases')}
            style={[styles.tabButton, activeTab === 'purchases' && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === 'purchases' && styles.activeTabText]}>
              List of Purchases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vendor Tab */}
        {activeTab === 'vendor' && (
          <View style={styles.tabContent}>
            {loading ? (
              <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>Loading vendors...</Text>
              </View>
            ) : vendors.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No vendors found</Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {vendors.map((vendor) => (
                  <View key={vendor._id} style={styles.vendorCard}>
                    <View style={styles.vendorCardContent}>
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>
                          {vendor.name}
                        </Text>
                        <View style={styles.vendorDetails}>
                          <View style={styles.detailRow}>
                            <MaterialIcons name="phone" size={16} color="#6b7280" />
                            <Text style={styles.detailText}>
                              {vendor.contact}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <MaterialIcons name="account-balance-wallet" size={16} color="#6b7280" />
                            <Text style={styles.detailText}>
                              Credit: ₹{vendor.credit.toLocaleString()}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <MaterialIcons name="inventory" size={16} color="#6b7280" style={{ marginTop: 2 }} />
                            <Text style={[styles.detailText, styles.itemsText]}>
                              Items: {vendor.items.join(', ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.vendorActions}>
                        <Pressable
                          onPress={() => handleDeleteVendor(vendor)}
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
        )}

        {/* List of Purchases Tab */}
        {activeTab === 'purchases' && (
          <View className="flex-1">
            {/* Filters */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Filters</Text>
              
              {/* Item Filter */}
              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-2">Filter by Item</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <TouchableOpacity
                    onPress={() => setFilterItem('all')}
                    className={`px-4 py-2 rounded-full mr-2 ${filterItem === 'all' ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${filterItem === 'all' ? 'text-white' : 'text-gray-700'}`}>
                      All Items
                    </Text>
                  </TouchableOpacity>
                  {getUniqueItems().map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setFilterItem(item)}
                      className={`px-4 py-2 rounded-full mr-2 ${filterItem === item ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-sm font-medium ${filterItem === item ? 'text-white' : 'text-gray-700'}`}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by Date Range:</Text>
                <View style={styles.dateFilterRow}>
                  <DatePicker
                    value={filterFromDate}
                    onDateChange={setFilterFromDate}
                    placeholder="From Date"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <DatePicker
                    value={filterToDate}
                    onDateChange={setFilterToDate}
                    placeholder="To Date"
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                </View>
              </View>
            </View>

            {/* Purchases List */}
            {purchases.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500 text-lg">No purchases found</Text>
              </View>
            ) : (
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {getFilteredPurchases().map((purchase) => (
                  <View
                    key={purchase._id}
                    className="bg-white rounded-xl p-5 mb-4 border border-gray-100 shadow-sm"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800 mb-3">
                          {purchase.item}
                        </Text>
                        <View className="space-y-2">
                          <View className="flex-row items-center">
                            <MaterialIcons name="business" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              {purchase.vendorName}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <MaterialIcons name="scale" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              {purchase.quantity} {purchase.unit}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <MaterialIcons name="attach-money" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              ₹{purchase.pricePerUnit} per {purchase.unit}
                            </Text>
                          </View>
                          <View className="bg-blue-50 rounded-lg p-3 mt-3">
                            <View className="flex-row justify-between items-center mb-1">
                              <Text className="text-sm font-medium text-blue-800">Total Price:</Text>
                              <Text className="text-sm font-bold text-blue-800">₹{purchase.totalPrice.toLocaleString()}</Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-1">
                              <Text className="text-sm font-medium text-blue-800">Amount Paid:</Text>
                              <Text className="text-sm font-bold text-blue-800">₹{purchase.amountPaid.toLocaleString()}</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                              <Text className="text-sm font-medium text-blue-800">Updated Credit:</Text>
                              <Text className="text-sm font-bold text-blue-800">₹{purchase.updatedCredit.toLocaleString()}</Text>
                            </View>
                          </View>
                          <View className="flex-row items-center mt-2">
                            <MaterialIcons name="event" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              {new Date(purchase.date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Add Vendor Button */}
      {activeTab === 'vendor' && (
        <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.addVendorButton}
            onPress={() => setShowAddVendorPopup(true)}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.buttonText}>Add Vendor</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Purchase Button */}
      {activeTab === 'purchases' && (
        <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.addPurchaseButton}
            onPress={() => setShowAddPurchasePopup(true)}
          >
            <MaterialIcons name="add-shopping-cart" size={22} color="#fff" />
            <Text style={styles.buttonText}>Add Purchase</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Popups */}
      {showAddVendorPopup && (
        <AddVendorPopup
          token={token}
          onClose={() => setShowAddVendorPopup(false)}
        />
      )}

      {showAddPurchasePopup && (
        <AddPurchasePopup
          token={token}
          onClose={() => setShowAddPurchasePopup(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff', // blue-50
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
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8', // blue-700
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#2563eb', // blue-600
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    color: '#4b5563', // gray-600
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280', // gray-500
    fontSize: 18,
  },
  emptyText: {
    color: '#6b7280', // gray-500
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  vendorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6', // gray-100
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vendorCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
    marginBottom: 12,
  },
  vendorDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563', // gray-600
    marginLeft: 8,
  },
  itemsText: {
    flex: 1,
  },
  vendorActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#fef2f2', // red-100
    borderRadius: 20,
    padding: 12,
    elevation: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  addVendorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb', // blue-600
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addPurchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669', // green-600
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  downloadButton: {
    padding: 8,
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 20,
    elevation: 2,
  },
  filterContainer: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}); 