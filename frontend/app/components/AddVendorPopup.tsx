import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
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
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Vendor</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={18} color="#64748b" />
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vendor Name *</Text>
              <TextInput
                placeholder="Enter vendor name"
                value={form.name}
                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                style={styles.textInput}
              />
            </View>

            {/* Contact */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact *</Text>
              <TextInput
                placeholder="Enter contact information"
                value={form.contact}
                onChangeText={(text) => setForm(prev => ({ ...prev, contact: text }))}
                style={styles.textInput}
              />
            </View>

            {/* Credit */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Credit Amount</Text>
              <TextInput
                placeholder="Enter credit amount"
                value={form.credit}
                onChangeText={(text) => setForm(prev => ({ ...prev, credit: text }))}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            {/* Items */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Items *</Text>
              
              {/* Add Item Input */}
              <View style={styles.addItemContainer}>
                <TextInput
                  placeholder="Enter item name"
                  value={newItem}
                  onChangeText={setNewItem}
                  style={styles.itemInput}
                />
                <TouchableOpacity
                  onPress={handleAddItem}
                  style={styles.addItemButton}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Items List */}
              {form.items.length > 0 && (
                <View style={styles.itemsList}>
                  {form.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(index)}
                        style={styles.removeItemButton}
                      >
                        <MaterialIcons name="close" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formContent: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 16,
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  itemInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 16,
  },
  addItemButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  itemText: {
    color: '#1f2937',
    flex: 1,
    fontSize: 14,
  },
  removeItemButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
}); 