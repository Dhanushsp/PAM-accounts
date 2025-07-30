import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AddCustomerPopup from '../components/AddCustomerPopup';
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
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contact: '',
    credit: ''
  });
  const [showAddCustomerPopup, setShowAddCustomerPopup] = useState(false);
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

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
      const response = await axios.get(`${BACKEND_URL}/api/customers`, {
        headers: { Authorization: token }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      contact: customer.contact,
      credit: customer.credit.toString()
    });
  };

  const handleUpdate = async () => {
    if (!editingCustomer) return;

    try {
      await axios.put(
        `${BACKEND_URL}/api/customers/${editingCustomer._id}`,
        editForm,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token 
          }
        }
      );
      Alert.alert('Success', 'Customer updated successfully');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
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
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${customer.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/customers/${customer._id}`, {
                headers: { Authorization: token }
              });
              Alert.alert('Success', 'Customer deleted successfully');
              fetchCustomers();
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  };

  if (editingCustomer) {
    return (
      <SafeAreaView className="flex-1 bg-blue-50">
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1" style={{ elevation: 3 }}>
            <Pressable
              onPress={() => setEditingCustomer(null)}
              className="bg-gray-100 rounded-full p-2"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
            </Pressable>
            <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center">Edit Customer</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Edit Form */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <TextInput
              placeholder="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TextInput
              placeholder="Contact"
              value={editForm.contact}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, contact: text }))}
              className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TextInput
              placeholder="Credit"
              value={editForm.credit}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, credit: text }))}
              keyboardType="numeric"
              className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TouchableOpacity
              onPress={handleUpdate}
              className="w-full bg-blue-600 py-3 rounded-xl shadow-sm"
            >
              <Text className="text-white text-center font-semibold text-lg">Update Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center">Customers</Text>
          <TouchableOpacity
            onPress={handleDownloadCustomers}
            className="bg-gray-100 rounded-full p-2"
            style={{ elevation: 2 }}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Loading customers...</Text>
          </View>
        ) : customers.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">No customers found</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} style={{ paddingBottom: 80 }}>
            {customers.map((customer) => (
              <View
                key={customer._id}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800 mb-2">
                      {customer.name}
                    </Text>
                    <View className="space-y-1">
                      <Text className="text-sm text-gray-600">Contact: {customer.contact}</Text>
                      <Text className="text-sm text-gray-600">Credit: ₹{customer.credit}</Text>
                      <Text className="text-sm text-gray-600">Joined: {new Date(customer.joinDate).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2 ml-2">
                    <Pressable
                      onPress={() => handleEdit(customer)}
                      className="bg-blue-100 rounded-full p-2"
                      style={{ elevation: 1 }}
                    >
                      <MaterialIcons name="edit" size={18} color="#2563EB" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(customer)}
                      className="bg-red-100 rounded-full p-2"
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

      {/* Add Customer Popup */}
      {showAddCustomerPopup && (
        <AddCustomerPopup
          token={token}
          onClose={() => setShowAddCustomerPopup(false)}
          onCustomerAdded={fetchCustomers}
        />
      )}

      {/* Add Button */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 4, alignItems: 'center' }}>
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
