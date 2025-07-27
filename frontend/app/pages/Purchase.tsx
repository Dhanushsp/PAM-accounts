import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
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

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1" style={{ elevation: 3 }}>
          <Pressable
            onPress={onBack}
            className="bg-gray-100 rounded-full p-2"
            style={{ elevation: 2 }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </Pressable>
          <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center" style={{ letterSpacing: 1 }}>
            Purchase Management
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-white rounded-xl p-1 mb-6 shadow-sm">
          <TouchableOpacity
            onPress={() => setActiveTab('vendor')}
            className={`flex-1 py-4 px-4 rounded-lg ${activeTab === 'vendor' ? 'bg-blue-600' : 'bg-transparent'}`}
          >
            <Text className={`text-center font-semibold text-base ${activeTab === 'vendor' ? 'text-white' : 'text-gray-600'}`}>
              Vendors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('purchases')}
            className={`flex-1 py-4 px-4 rounded-lg ${activeTab === 'purchases' ? 'bg-blue-600' : 'bg-transparent'}`}
          >
            <Text className={`text-center font-semibold text-base ${activeTab === 'purchases' ? 'text-white' : 'text-gray-600'}`}>
              List of Purchases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vendor Tab */}
        {activeTab === 'vendor' && (
          <View className="flex-1">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500 text-lg">Loading vendors...</Text>
              </View>
            ) : vendors.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-500 text-lg">No vendors found</Text>
              </View>
            ) : (
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {vendors.map((vendor) => (
                  <View
                    key={vendor._id}
                    className="bg-white rounded-xl p-5 mb-4 border border-gray-100 shadow-sm"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800 mb-3">
                          {vendor.name}
                        </Text>
                        <View className="space-y-2">
                          <View className="flex-row items-center">
                            <MaterialIcons name="phone" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              {vendor.contact}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <MaterialIcons name="account-balance-wallet" size={16} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-2">
                              Credit: ₹{vendor.credit.toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex-row items-start">
                            <MaterialIcons name="inventory" size={16} color="#6b7280" style={{ marginTop: 2 }} />
                            <Text className="text-sm text-gray-600 ml-2 flex-1">
                              Items: {vendor.items.join(', ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row gap-2 ml-3">
                        <Pressable
                          onPress={() => handleDeleteVendor(vendor)}
                          className="bg-red-100 rounded-full p-3"
                          style={{ elevation: 1 }}
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
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Implement date picker
                    Alert.alert('Date Picker', 'Date picker functionality will be implemented');
                  }}
                  className="flex-1 bg-gray-100 rounded-lg p-3"
                >
                  <Text className="text-sm text-gray-600">From Date</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {filterFromDate ? filterFromDate.toLocaleDateString() : 'Select'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Implement date picker
                    Alert.alert('Date Picker', 'Date picker functionality will be implemented');
                  }}
                  className="flex-1 bg-gray-100 rounded-lg p-3"
                >
                  <Text className="text-sm text-gray-600">To Date</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {filterToDate ? filterToDate.toLocaleDateString() : 'Select'}
                  </Text>
                </TouchableOpacity>
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
            onPress={() => setShowAddVendorPopup(true)}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Add Vendor</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Purchase Button */}
      {activeTab === 'purchases' && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 12, alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#059669',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.10,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => setShowAddPurchasePopup(true)}
          >
            <MaterialIcons name="add-shopping-cart" size={22} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Add Purchase</Text>
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