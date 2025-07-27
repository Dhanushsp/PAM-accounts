import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface Vendor {
  _id: string;
  name: string;
  contact: string;
  credit: number;
  items: string[];
}

interface AddPurchasePopupProps {
  token: string;
  onClose: () => void;
}

export default function AddPurchasePopup({ token, onClose }: AddPurchasePopupProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({
    item: '',
    vendor: '',
    quantity: '',
    unit: 'packs' as 'packs' | 'kgs',
    pricePerUnit: '',
    amountPaid: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/vendors`, {
        headers: { Authorization: token }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to fetch vendors. Please check your connection and try again.');
    }
  };

  // Calculate totals
  const totalPurchasePrice = parseFloat(form.quantity) * parseFloat(form.pricePerUnit) || 0;
  const totalAmountToBePaid = (selectedVendor?.credit || 0) + totalPurchasePrice;
  const updatedCredit = totalAmountToBePaid - (parseFloat(form.amountPaid) || 0);

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setForm(prev => ({ ...prev, vendor: vendor._id }));
  };

  const handleSubmit = async () => {
    if (!form.item.trim()) {
      Alert.alert('Error', 'Please select an item');
      return;
    }

    if (!form.vendor) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!form.pricePerUnit || parseFloat(form.pricePerUnit) <= 0) {
      Alert.alert('Error', 'Please enter a valid price per unit');
      return;
    }

    if (!form.amountPaid || parseFloat(form.amountPaid) < 0) {
      Alert.alert('Error', 'Please enter a valid amount paid');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/purchases`, {
        item: form.item,
        vendor: form.vendor,
        vendorName: selectedVendor?.name,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        pricePerUnit: parseFloat(form.pricePerUnit),
        totalPrice: totalPurchasePrice,
        amountPaid: parseFloat(form.amountPaid),
        updatedCredit: updatedCredit,
        date: new Date().toISOString()
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });

      // Update vendor credit
      await axios.put(`${BACKEND_URL}/api/vendors/${form.vendor}`, {
        credit: updatedCredit
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });
      
      Alert.alert('Success', 'Purchase added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding purchase:', error);
      Alert.alert('Error', 'Failed to add purchase');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueItems = () => {
    const items = new Set<string>();
    vendors.forEach(vendor => {
      vendor.items.forEach(item => items.add(item));
    });
    return Array.from(items);
  };

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center z-50">
      <View className="bg-white rounded-2xl mx-6 w-full max-w-sm max-h-[85%]" style={{ marginBottom: insets.bottom + 20, marginTop: insets.top + 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">Add Purchase</Text>
          <Pressable
            onPress={onClose}
            className="bg-gray-100 rounded-full p-2"
          >
            <MaterialIcons name="close" size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="space-y-4">
            {/* Item Selection */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Select Item *</Text>
              {getUniqueItems().length === 0 ? (
                <View className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <Text className="text-sm text-yellow-800 text-center">
                    No items found. Please add items to vendors first.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {getUniqueItems().map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setForm(prev => ({ ...prev, item }))}
                      className={`px-4 py-2 rounded-full mr-2 ${form.item === item ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-sm font-medium ${form.item === item ? 'text-white' : 'text-gray-700'}`}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Vendor Selection */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Select Vendor *</Text>
              {vendors.length === 0 ? (
                <View className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <Text className="text-sm text-yellow-800 text-center">
                    No vendors found. Please add vendors first.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {vendors.map((vendor) => (
                    <TouchableOpacity
                      key={vendor._id}
                      onPress={() => handleVendorSelect(vendor)}
                      className={`px-4 py-2 rounded-full mr-2 ${form.vendor === vendor._id ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-sm font-medium ${form.vendor === vendor._id ? 'text-white' : 'text-gray-700'}`}>
                        {vendor.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Vendor Credit Display */}
            {selectedVendor && (
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-sm text-blue-800">
                  Vendor Credit: ₹{selectedVendor.credit}
                </Text>
              </View>
            )}

            {/* Quantity and Unit */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Quantity *</Text>
                <TextInput
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChangeText={(text) => setForm(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">Unit</Text>
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                  <TouchableOpacity
                    onPress={() => setForm(prev => ({ ...prev, unit: 'packs' }))}
                    className={`flex-1 py-2 px-3 rounded-lg ${form.unit === 'packs' ? 'bg-white' : 'bg-transparent'}`}
                  >
                    <Text className={`text-center text-sm font-medium ${form.unit === 'packs' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Packs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setForm(prev => ({ ...prev, unit: 'kgs' }))}
                    className={`flex-1 py-2 px-3 rounded-lg ${form.unit === 'kgs' ? 'bg-white' : 'bg-transparent'}`}
                  >
                    <Text className={`text-center text-sm font-medium ${form.unit === 'kgs' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Kgs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Price per Unit */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Price per {form.unit} *</Text>
              <TextInput
                placeholder={`Enter price per ${form.unit}`}
                value={form.pricePerUnit}
                onChangeText={(text) => setForm(prev => ({ ...prev, pricePerUnit: text }))}
                keyboardType="numeric"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
              />
            </View>

            {/* Total Purchase Price */}
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm text-gray-600">Total Purchase Price</Text>
              <Text className="text-lg font-bold text-gray-800">₹{totalPurchasePrice.toFixed(2)}</Text>
            </View>

            {/* Total Amount to be Paid */}
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-sm text-blue-600">Total Amount to be Paid</Text>
              <Text className="text-lg font-bold text-blue-800">₹{totalAmountToBePaid.toFixed(2)}</Text>
            </View>

            {/* Amount Paid */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Amount Paid *</Text>
              <TextInput
                placeholder="Enter amount paid"
                value={form.amountPaid}
                onChangeText={(text) => setForm(prev => ({ ...prev, amountPaid: text }))}
                keyboardType="numeric"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
              />
            </View>

            {/* Updated Credit */}
            <View className="bg-green-50 rounded-lg p-3">
              <Text className="text-sm text-green-600">Updated Credit</Text>
              <Text className="text-lg font-bold text-green-800">₹{updatedCredit.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="p-6 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-xl ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Adding...' : 'Purchase'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
} 