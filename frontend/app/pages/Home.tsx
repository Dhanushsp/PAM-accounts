import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, BackHandler, Alert, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';
import AddCustomerPopup from '../components/AddCustomerPopup';
import AddProductPopup from '../components/AddProductPopup';
import AddSale from '../components/AddSale';
import CustomerSalesModal from '../components/CustomerSalesModal';
import SideNav from '../components/SideNav';
import Products from './Products';

interface Customer {
  _id: string;
  name: string;
  credit: number;
  lastPurchase?: string;
  sales?: Array<{ date: string }>;
}

interface HomeProps {
  token: string;
  onLogout: () => void;
}

export default function Home({ token, onLogout }: HomeProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showPopup, setShowPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const insets = useSafeAreaInsets();

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers?search=${search}`, {
        headers: { Authorization: token },
      });
      
      // Apply client-side sorting as backup
      let sortedCustomers = [...res.data];
      
      if (sort === 'recent') {
        sortedCustomers.sort((a, b) => {
          const dateA = getLatestPurchaseDate(a);
          const dateB = getLatestPurchaseDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // null dates go to the end
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime(); // descending (recent first)
        });
      } else if (sort === 'oldest') {
        sortedCustomers.sort((a, b) => {
          const dateA = getLatestPurchaseDate(a);
          const dateB = getLatestPurchaseDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return -1; // null dates go to the beginning
          if (!dateB) return 1;
          return dateA.getTime() - dateB.getTime(); // ascending (oldest first)
        });
      } else if (sort === 'credit') {
        sortedCustomers.sort((a, b) => b.credit - a.credit); // descending (highest credit first)
      }
      
      setCustomers(sortedCustomers);

      if (selectedCustomer) {
        const customerRes = await axios.get(`${API_BASE_URL}/api/customers/${selectedCustomer._id}`, {
          headers: { Authorization: token },
        });
        setSelectedCustomer(customerRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers. Please check your connection.');
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers/${customerId}`, {
        headers: { Authorization: token },
      });
      setSelectedCustomer(res.data);
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      Alert.alert('Error', 'Failed to fetch customer details.');
    }
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setIsSideNavOpen(false);
  };

  // Helper function to get the latest purchase date
  const getLatestPurchaseDate = (customer: any) => {
    // First try the lastPurchase field
    if (customer.lastPurchase) {
      return new Date(customer.lastPurchase);
    }
    
    // If no lastPurchase field, try to get from sales array
    if (customer.sales && customer.sales.length > 0) {
      const latestSale = customer.sales.reduce((latest: any, sale: any) => {
        const saleDate = new Date(sale.date);
        const latestDate = new Date(latest.date);
        return saleDate > latestDate ? sale : latest;
      });
      return new Date(latestSale.date);
    }
    
    return null;
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, sort]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (isSideNavOpen) {
        setIsSideNavOpen(false);
        return true; // Prevent default back action
      }
      if (currentPage !== 'home') {
        setCurrentPage('home');
        return true; // Prevent default back action
      }
      if (showPopup) {
        setShowPopup(false);
        return true; // Prevent default back action
      }
      if (showProductPopup) {
        setShowProductPopup(false);
        return true; // Prevent default back action
      }
      if (showSalesPopup) {
        setShowSalesPopup(false);
        return true; // Prevent default back action
      }
      if (selectedCustomer) {
        setSelectedCustomer(null);
        return true; // Prevent default back action
      }
      return false; // Allow default back action (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isSideNavOpen, currentPage, showPopup, showProductPopup, showSalesPopup, selectedCustomer]);

  // Show Products page if currentPage is 'products'
  if (currentPage === 'products') {
    return (
      <Products 
        onBack={() => setCurrentPage('home')} 
        token={token} 
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-3">
      {/* Modernized Top Navbar */}
      <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-4 mt-1" style={{ elevation: 3 }}>
        <Pressable
          onPress={() => setIsSideNavOpen(true)}
          className="bg-gray-100 rounded-full p-2 mr-2"
          style={{ elevation: 2 }}
        >
          <MaterialIcons name="menu" size={24} color="#2563EB" />
        </Pressable>
        <Text className="text-2xl font-extrabold text-blue-700 flex-1 text-center" style={{ letterSpacing: 1 }}>
          PAM<Text className="text-blue-500">-Accounts</Text>
        </Text>
        <Pressable
          onPress={onLogout}
          className="bg-red-100 rounded-full p-2 ml-2"
          style={{ elevation: 2 }}
        >
          <MaterialIcons name="logout" size={22} color="#dc2626" />
        </Pressable>
      </View>

      {/* Search */}
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 text-black bg-white mb-4 text-base shadow-sm"
        placeholder="🔍 Search by customer name"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />

      {/* Modernized Filter Buttons */}
      <View className="flex-row justify-center gap-3 mb-4">
        {['Recent', 'Oldest', 'Credit'].map((type) => {
          const selected = sort === type.toLowerCase();
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setSort(type.toLowerCase())}
              className={`px-5 py-2 rounded-full shadow-sm ${selected ? 'bg-blue-600' : 'bg-gray-100'}`}
              style={{ elevation: selected ? 2 : 0 }}
            >
              <Text className={`font-bold text-base ${selected ? 'text-white' : 'text-blue-700'}`}>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Customer list */}
      <ScrollView className="flex-1 mb-4">
        {customers.length === 0 && (
          <Text className="text-center text-gray-400 mt-5">No customers found.</Text>
        )}
        {customers.map((c) => (
          <TouchableOpacity
            key={c._id}
            onPress={() => fetchCustomerDetails(c._id)}
            className="flex-row justify-between items-center bg-white px-4 py-3 mb-1 rounded-lg"
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800 mb-1">{c.name}</Text>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-400 mr-1">📅</Text>
                <Text className="text-xs text-gray-600 font-medium">
                  {(() => {
                    const latestDate = getLatestPurchaseDate(c);
                    if (latestDate) {
                      return `Last purchase: ${latestDate.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}`;
                    }
                    return 'No purchases yet';
                  })()}
                </Text>
              </View>
            </View>
            <Text className="text-blue-700 font-bold text-lg ml-3">₹{c.credit}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modernized Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-2 pt-2 flex-row gap-3 justify-between items-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderColor: '#dbeafe', paddingBottom: insets.bottom + 6, elevation: 8 }}>
        <TouchableOpacity
          onPress={() => setShowSalesPopup(true)}
          className="flex-1 flex-row items-center justify-center bg-green-600 py-3 rounded-full shadow-md gap-2"
          style={{ elevation: 2 }}
        >
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text className="text-white text-center font-bold text-base">Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowProductPopup(true)}
          className="flex-1 flex-row items-center justify-center bg-blue-600 py-3 rounded-full shadow-md gap-2"
          style={{ elevation: 2 }}
        >
          <FontAwesome5 name="box" size={16} color="#fff" />
          <Text className="text-white text-center font-bold text-base">Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowPopup(true)}
          className="flex-1 flex-row items-center justify-center bg-indigo-600 py-3 rounded-full shadow-md gap-2"
          style={{ elevation: 2 }}
        >
          <FontAwesome5 name="user-plus" size={16} color="#fff" />
          <Text className="text-white text-center font-bold text-base">Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Popups and SideNav remain unchanged */}
      {showPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}
      
      {showProductPopup && (
        <AddProductPopup
          token={token}
          onClose={() => setShowProductPopup(false)}
        />
      )}
      
      {showSalesPopup && (
        <AddSale
          token={token}
          onClose={() => setShowSalesPopup(false)}
          onSaleAdded={fetchCustomers}
          onSetSortToRecent={() => setSort('recent')}
        />
      )}

      {selectedCustomer && (
        <CustomerSalesModal
          customer={selectedCustomer as any}
          onClose={() => setSelectedCustomer(null)}
          onEditSale={(sale) => console.log('Edit sale:', sale)}
          onRefresh={() => fetchCustomerDetails(selectedCustomer._id)}
        />
      )}

      {/* Side Navigation */}
      <SideNav
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        onLogout={onLogout}
        onNavigate={handleNavigation}
      />
      </View>
    </SafeAreaView>
  );
}
