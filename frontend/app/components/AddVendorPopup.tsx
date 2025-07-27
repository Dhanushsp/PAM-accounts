import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface AddVendorPopupProps {
  token: string;
  onClose: () => void;
}

export default function AddVendorPopup({ token, onClose }: AddVendorPopupProps) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    credit: '',
    items: [] as string[]
  });
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleAddItem = () => {
    if (newItem.trim()) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter vendor name');
      return;
    }

    if (!form.contact.trim()) {
      Alert.alert('Error', 'Please enter contact information');
      return;
    }

    if (form.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/vendors`, {
        name: form.name.trim(),
        contact: form.contact.trim(),
        credit: parseFloat(form.credit) || 0,
        items: form.items
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });
      
      Alert.alert('Success', 'Vendor added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 justify-center items-center z-50">
      <View className="bg-white rounded-2xl mx-6 w-full max-w-sm" style={{ marginBottom: insets.bottom + 20, marginTop: insets.top + 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">Add Vendor</Text>
          <Pressable
            onPress={onClose}
            className="bg-gray-100 rounded-full p-2"
          >
            <MaterialIcons name="close" size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Form */}
        <View className="flex-1 p-6">
          <View className="space-y-4">
            {/* Name */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Vendor Name *</Text>
              <TextInput
                placeholder="Enter vendor name"
                value={form.name}
                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
              />
            </View>

            {/* Contact */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Contact *</Text>
              <TextInput
                placeholder="Enter contact information"
                value={form.contact}
                onChangeText={(text) => setForm(prev => ({ ...prev, contact: text }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
              />
            </View>

            {/* Credit */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Credit Amount</Text>
              <TextInput
                placeholder="Enter credit amount"
                value={form.credit}
                onChangeText={(text) => setForm(prev => ({ ...prev, credit: text }))}
                keyboardType="numeric"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
              />
            </View>

            {/* Items */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Items *</Text>
              
              {/* Add Item Input */}
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  placeholder="Enter item name"
                  value={newItem}
                  onChangeText={setNewItem}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
                />
                <TouchableOpacity
                  onPress={handleAddItem}
                  className="bg-blue-600 px-4 py-3 rounded-xl"
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Items List */}
              {form.items.length > 0 && (
                <View className="space-y-2">
                  {form.items.map((item, index) => (
                    <View key={index} className="flex-row items-center justify-between bg-gray-100 rounded-lg p-3">
                      <Text className="text-gray-800 flex-1">{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(index)}
                        className="bg-red-100 rounded-full p-1 ml-2"
                      >
                        <MaterialIcons name="close" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="p-6 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-xl ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Adding...' : 'Add Vendor'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
} 