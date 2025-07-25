import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
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
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Close */}
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { elevation: 3 }]}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>
        {/* Title */}
        <Text style={styles.title}>Add Product</Text>
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Product Name"
            value={form.productName}
            onChangeText={v => handleChange('productName', v)}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Price per Pack"
            value={form.pricePerPack}
            onChangeText={v => handleChange('pricePerPack', v)}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Kgs per Pack"
            value={form.kgsPerPack}
            onChangeText={v => handleChange('kgsPerPack', v)}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Price per Kg"
            value={form.pricePerKg}
            editable={false}
            style={styles.inputDisabled}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#fff',
    width: '91%', // w-11/12
    maxWidth: 480, // max-w-xl
    borderRadius: 24, // rounded-3xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12, // top-3
    right: 12, // right-3
    zIndex: 10,
    backgroundColor: '#f3f4f6', // bg-gray-100
    borderRadius: 999,
    padding: 8, // p-2
  },
  title: {
    fontSize: 18, // text-lg
    fontWeight: 'bold',
    color: '#1d4ed8', // text-blue-700
    textAlign: 'center',
    paddingTop: 28, // pt-7
    paddingBottom: 8, // pb-2
  },
  formContainer: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 24, // pb-6
    paddingTop: 8, // pt-2
  },
  input: {
    marginBottom: 16, // mb-4
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    borderRadius: 16, // rounded-xl
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    backgroundColor: '#f9fafb', // bg-gray-50
    color: '#000',
    fontSize: 16, // text-base
  },
  inputDisabled: {
    marginBottom: 16, // mb-4
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    borderRadius: 16, // rounded-xl
    borderWidth: 1,
    borderColor: '#f3f4f6', // border-gray-100
    backgroundColor: '#f3f4f6', // bg-gray-100
    color: '#6b7280', // text-gray-500
    fontSize: 16, // text-base
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#2563eb', // bg-blue-600
    paddingVertical: 12, // py-3
    borderRadius: 16, // rounded-xl
    marginTop: 8, // mt-2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600', // font-semibold
    fontSize: 16, // text-base
  },
});
