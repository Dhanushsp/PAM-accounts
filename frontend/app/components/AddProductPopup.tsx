import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import axios from 'axios';


export default function AddProductPopup({ token, onClose }) {
  const [form, setForm] = useState({
    productName: '',
    pricePerPack: '',
    kgsPerPack: '',
    pricePerKg: ''
  });

  useEffect(() => {
    const { pricePerPack, kgsPerPack } = form;
    if (pricePerPack && kgsPerPack && !isNaN(pricePerPack) && !isNaN(kgsPerPack)) {
      const perKg = parseFloat(pricePerPack) / parseFloat(kgsPerPack);
      setForm((prev) => ({
        ...prev,
        pricePerKg: perKg.toFixed(2)
      }));
    }
  }, [form.pricePerPack, form.kgsPerPack]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/addproducts`,
        form,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          }
        }
      );
      alert(res.data.message || "Product added!");
      onClose();
    } catch (err) {
      console.error('Error adding product:', err);
      if (err.response?.status === 403) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to add product. Please try again.');
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

        <Text className="text-xl mb-4 font-bold text-blue-700 text-center">Add Product</Text>

        <TextInput
          placeholder="Product Name"
          value={form.productName}
          onChangeText={(text) => handleChange('productName', text)}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Price per Pack"
          value={form.pricePerPack}
          onChangeText={(text) => handleChange('pricePerPack', text)}
          keyboardType="numeric"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Kgs per Pack"
          value={form.kgsPerPack}
          onChangeText={(text) => handleChange('kgsPerPack', text)}
          keyboardType="numeric"
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
        />
        <TextInput
          placeholder="Price per Kg"
          value={form.pricePerKg}
          editable={false}
          className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500"
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
