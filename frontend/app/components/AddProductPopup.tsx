import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import KeyboardAwarePopup from './KeyboardAwarePopup';

interface AddProductPopupProps {
  token: string;
  onClose: () => void;
  onProductAdded: () => void;
  editProduct?: {
    productName: string;
    pricePerPack: string;
    kgsPerPack: string;
    pricePerKg: string;
  };
}

export default function AddProductPopup({ token, onClose, onProductAdded, editProduct }: AddProductPopupProps) {
  const [form, setForm] = useState({
    productName: editProduct?.productName || '',
    pricePerKg: editProduct?.pricePerKg?.toString() || '',
    pricePerPack: editProduct?.pricePerPack?.toString() || '',
    kgsPerPack: editProduct?.kgsPerPack?.toString() || '',
  });

  // Keyboard detection
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Calculate dynamic heights based on keyboard state
  const availableHeight = screenHeight - keyboardHeight - 40;
  const containerMaxHeight = keyboardVisible 
    ? Math.min(screenHeight * 0.8, availableHeight)
    : screenHeight * 0.95;

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
      Alert.alert('Success', res.data.message || "Product added!");
      onClose();
      onProductAdded();
    } catch (err: any) {
      console.error('Error adding product:', err);
      if (err.response?.status === 403) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
      } else {
        Alert.alert('Error', 'Failed to add product. Please try again.');
      }
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={[
        styles.keyboardAvoidingTop,
        keyboardVisible && {
          justifyContent: 'flex-end',
          paddingBottom: 20,
        }
      ]}>
        <View style={[
          styles.container, 
          { maxHeight: containerMaxHeight }, 
          styles.containerTop,
          keyboardVisible && {
            marginBottom: 0,
          }
        ]}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color="#64748b" />
          </Pressable>

          <Text style={styles.title}>Add Product</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <TextInput
              placeholder="Product Name"
              value={form.productName}
              onChangeText={v => handleChange('productName', v)}
              style={styles.input}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder="Price per Kg"
              value={form.pricePerKg}
              onChangeText={v => handleChange('pricePerKg', v)}
              keyboardType="numeric"
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

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
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
  keyboardAvoidingTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    paddingTop: 20,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#fff',
    width: '91%',
    maxWidth: 480,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  containerTop: {
    marginTop: 0,
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
  keyboardAwareContainer: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 24, // pb-6
    paddingTop: 8, // pt-2
  },
  input: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#000',
    fontSize: 16,
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
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
