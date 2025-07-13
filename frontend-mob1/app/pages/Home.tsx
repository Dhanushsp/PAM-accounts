import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import axios from 'axios';
import AddCustomerPopup from '../components/AddCustomerPopup';
import AddProductPopup from '../components/AddProductPopup';
import AddSale from '../components/AddSale';
import CustomerSalesModal from '../components/CustomerSalesModal';
import SideNav from '../components/SideNav';
import Products from './Products';

export default function Home({ token, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [showPopup, setShowPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showSalesPopup, setShowSalesPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers?search=${search}`, {
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
        const customerRes = await axios.get(`${BACKEND_URL}/api/customers/${selectedCustomer._id}`, {
          headers: { Authorization: token },
        });
        setSelectedCustomer(customerRes.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers/${customerId}`, {
        headers: { Authorization: token },
      });
      setSelectedCustomer(res.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setIsSideNavOpen(false);
  };

  // Helper function to get the latest purchase date
  const getLatestPurchaseDate = (customer) => {
    // First try the lastPurchase field
    if (customer.lastPurchase) {
      return new Date(customer.lastPurchase);
    }
    
    // If no lastPurchase field, try to get from sales array
    if (customer.sales && customer.sales.length > 0) {
      const latestSale = customer.sales.reduce((latest, sale) => {
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
      
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setIsSideNavOpen(true)}
            className="mr-3 p-2 rounded-lg bg-gray-100"
          >
            <Text className="text-xl">☰</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-700">
            <Text>PAM</Text><Text className="text-blue-600">-Accounts</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={onLogout}
          className="bg-red-600 px-3 py-1.5 rounded-lg"
        >
          <Text className="text-white font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-3"
        placeholder="🔍 Search by customer name"
        value={search}
        onChangeText={setSearch}
      />

      {/* Sort buttons */}
      <View className="flex-row flex-wrap gap-2 justify-center mb-3">
        {['Recent', 'Oldest', 'Credit'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setSort(type.toLowerCase())}
            className={`px-4 py-2 rounded-lg border ${
              sort === type.toLowerCase()
                ? 'bg-blue-600'
                : 'bg-white'
            }`}
          >
            <Text className={`font-medium text-sm ${
              sort === type.toLowerCase()
                ? 'text-white'
                : 'text-gray-700'
            }`}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Customer list */}
      <ScrollView className="flex-1 mb-20">
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

      {/* Bottom action buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-blue-100 px-4 py-3 flex-row justify-between gap-2 border-t border-blue-200" style={{ paddingBottom: insets.bottom + 12 }}>
        <TouchableOpacity
          onPress={() => setShowSalesPopup(true)}
          className="flex-1 bg-green-600 py-2 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">+ Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowProductPopup(true)}
          className="flex-1 bg-blue-600 py-2 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">+ Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowPopup(true)}
          className="flex-1 bg-indigo-600 py-2 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">+ Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Popups */}
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
          customer={selectedCustomer}
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
