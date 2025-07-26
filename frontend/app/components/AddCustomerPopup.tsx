import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface AddCustomerPopupProps {
  token: string;
  onClose: () => void;
  onCustomerAdded: () => void;
  editCustomer?: {
    _id: string;
    name: string;
    contact: string;
    credit: number;
    joinDate: string;
  };
}

export default function AddCustomerPopup({ token, onClose, onCustomerAdded, editCustomer }: AddCustomerPopupProps) {
  const [form, setForm] = useState({
    name: editCustomer?.name || '',
    contact: editCustomer?.contact || '',
    credit: editCustomer?.credit?.toString() || '',
    joinDate: editCustomer?.joinDate || new Date().toISOString().split('T')[0],
  });

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editCustomer) {
        // Edit mode: PUT request
        const res = await axios.put(`${BACKEND_URL}/api/customers/${editCustomer._id}`, form, {
          headers: { 'Content-Type': 'application/json', Authorization: token }
        });
        alert(res.data.message || 'Customer updated!');
      } else {
        // Add mode: POST request
        const res = await axios.post(`${BACKEND_URL}/api/customers`, form, {
          headers: { 'Content-Type': 'application/json', Authorization: token }
        });
        alert(res.data.message || 'Customer added!');
      }
      onCustomerAdded();
      onClose();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      if (err.response?.status === 403) {
        alert('Authentication failed. Please login again.');
      } else {
        alert('Failed to save customer. Please try again.');
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
        <Text style={styles.title}>{editCustomer ? 'Edit Customer' : 'Add Customer'}</Text>
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Name"
            value={form.name}
            onChangeText={v => handleChange('name', v)}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Contact"
            value={form.contact}
            onChangeText={v => handleChange('contact', v)}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Credit Amount"
            value={form.credit}
            onChangeText={v => handleChange('credit', v)}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TextInput
            placeholder="Join Date"
            value={form.joinDate}
            onChangeText={v => handleChange('joinDate', v)}
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>{editCustomer ? 'Save' : 'Submit'}</Text>
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
