import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import apiClient from '../../lib/axios-config';

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

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editCustomer) {
        // Edit mode: PUT request
        const res = await apiClient.put(`/api/customers/${editCustomer._id}`, form);
        Alert.alert('Success', res.data.message || 'Customer updated!');
      } else {
        // Add mode: POST request
      const res = await apiClient.post(`/api/customers`, form);
      Alert.alert('Success', res.data.message || 'Customer added!');
      }
      onCustomerAdded();
      onClose();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      if (err.response?.status === 403) {
        Alert.alert('Error', 'Authentication failed. Please login again.');
      } else {
        Alert.alert('Error', 'Failed to save customer. Please try again.');
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

          <Text style={styles.title}>{editCustomer ? 'Edit Customer' : 'Add Customer'}</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
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
              placeholder="Join Date (YYYY-MM-DD)"
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
