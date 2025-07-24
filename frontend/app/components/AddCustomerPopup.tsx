import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface AddCustomerPopupProps {
  token: string;
  onClose: () => void;
  onCustomerAdded: () => void;
}

export default function AddCustomerPopup({ token, onClose, onCustomerAdded }: AddCustomerPopupProps) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    credit: '',
    joinDate: new Date().toISOString().split('T')[0],
  });

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/customers`, form, {
        headers: { 'Content-Type': 'application/json', Authorization: token }
      });
      alert(res.data.message || 'Customer added!');
      onCustomerAdded();
      onClose();
    } catch (err: any) {
      console.error('Error adding customer:', err);
      if (err.response?.status === 403) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to add customer. Please try again.');
      }
    }
  };

  return (
    <View className="absolute inset-0 z-50 flex-1 justify-center items-center bg-black/40">
      <View className="bg-white w-11/12 max-w-xl rounded-3xl shadow-lg overflow-hidden relative">
        {/* Close */}
        <Pressable
          onPress={onClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 rounded-full p-2"
          style={{ elevation: 3 }}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>
        {/* Title */}
        <Text className="text-lg font-bold text-blue-700 text-center pt-7 pb-2">Add Customer</Text>
        <View className="px-6 pb-6 pt-2">
          <TextInput
            placeholder="Name"
            value={form.name}
            onChangeText={v => handleChange('name', v)}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Contact"
            value={form.contact}
            onChangeText={v => handleChange('contact', v)}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Credit Amount"
            value={form.credit}
            onChangeText={v => handleChange('credit', v)}
            keyboardType="numeric"
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Join Date"
            value={form.joinDate}
            onChangeText={v => handleChange('joinDate', v)}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            onPress={handleSubmit}
            className="w-full bg-blue-600 py-3 rounded-xl mt-2 active:scale-95 shadow-sm"
          >
            <Text className="text-white text-center font-semibold text-base">Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
