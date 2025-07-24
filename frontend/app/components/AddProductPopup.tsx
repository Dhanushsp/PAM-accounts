import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface AddProductPopupProps {
  token: string;
  onClose: () => void;
}

export default function AddProductPopup({ token, onClose }: AddProductPopupProps) {
  const [form, setForm] = useState({
    productName: '',
    pricePerPack: '',
    kgsPerPack: '',
    pricePerKg: ''
  });

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    const { pricePerPack, kgsPerPack } = form;
    if (pricePerPack && kgsPerPack && !isNaN(+pricePerPack) && !isNaN(+kgsPerPack)) {
      const perKg = parseFloat(pricePerPack) / parseFloat(kgsPerPack);
      setForm(prev => ({ ...prev, pricePerKg: perKg.toFixed(2) }));
    }
  }, [form.pricePerPack, form.kgsPerPack]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/addproducts`, form, {
        headers: { 'Content-Type': 'application/json', Authorization: token }
      });
      alert(res.data.message || "Product added!");
      onClose();
    } catch (err: any) {
      console.error('Error adding product:', err);
      if (err.response?.status === 403) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to add product. Please try again.');
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
        <Text className="text-lg font-bold text-blue-700 text-center pt-7 pb-2">Add Product</Text>
        <View className="px-6 pb-6 pt-2">
          <TextInput
            placeholder="Product Name"
            value={form.productName}
            onChangeText={v => handleChange('productName', v)}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Price per Pack"
            value={form.pricePerPack}
            onChangeText={v => handleChange('pricePerPack', v)}
            keyboardType="numeric"
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Kgs per Pack"
            value={form.kgsPerPack}
            onChangeText={v => handleChange('kgsPerPack', v)}
            keyboardType="numeric"
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Price per Kg"
            value={form.pricePerKg}
            editable={false}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 text-base"
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
