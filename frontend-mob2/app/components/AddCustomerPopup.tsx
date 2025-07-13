import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Pressable } from 'react-native';
import axios from 'axios';


export default function AddCustomerPopup({ token, onClose, onCustomerAdded }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    credit: '',
    joinDate: new Date().toISOString().split('T')[0],
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/customers`,
        form,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        }
      );
      alert(res.data.message || 'Customer added!');
      onCustomerAdded();
      onClose();
    } catch (err) {
      console.error('Error adding customer:', err);
      if (err.response?.status === 403) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to add customer. Please try again.');
      }
    }
  };

  return (
    <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
              <View className="bg-white p-4 rounded-2xl w-11/12 max-w-sm relative">
        {/* Close button */}
        <Pressable onPress={onClose} className="absolute top-2 right-3">
          <Text className="text-gray-400 text-2xl font-bold">&times;</Text>
        </Pressable>

        <Text className="text-xl mb-4 font-bold text-blue-700 text-center">Add Customer</Text>

        <TextInput
          placeholder="Name"
          value={form.name}
          onChangeText={(text) => handleChange('name', text)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Contact"
          value={form.contact}
          onChangeText={(text) => handleChange('contact', text)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Credit Amount"
          value={form.credit}
          onChangeText={(text) => handleChange('credit', text)}
          keyboardType="numeric"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Join Date"
          value={form.joinDate}
          onChangeText={(text) => handleChange('joinDate', text)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          className="w-full bg-blue-600 py-2 rounded-lg mt-2 active:scale-95"
        >
          <Text className="text-white text-center font-semibold">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
