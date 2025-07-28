import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import KeyboardAwarePopup from './KeyboardAwarePopup';

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
  const [allItems, setAllItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchAllItems();
  }, []);

  const fetchAllItems = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/vendors`, {
        headers: { Authorization: token }
      });
      
      // Extract all unique items from all vendors
      const items = new Set<string>();
      response.data.forEach((vendor: any) => {
        vendor.items.forEach((item: string) => items.add(item));
      });
      setAllItems(Array.from(items));
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleAddItem = () => {
    if (newItem.trim() && !form.items.includes(newItem.trim())) {
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

  const handleSelectExistingItem = (item: string) => {
    if (!form.items.includes(item)) {
      setForm(prev => ({
        ...prev,
        items: [...prev.items, item]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.contact.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/vendors`, {
        name: form.name.trim(),
        contact: form.contact.trim(),
        credit: parseFloat(form.credit) || 0,
        items: form.items
      }, {
        headers: { Authorization: token }
      });

      Alert.alert('Success', 'Vendor added successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Vendor</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAwarePopup
          style={styles.keyboardAwareContainer}
          contentContainerStyle={styles.contentContainer}
          extraScrollHeight={100}
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              placeholder="Vendor Name"
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
              style={styles.textInput}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Contact Number"
              value={form.contact}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact: text }))}
              style={styles.textInput}
              keyboardType="phone-pad"
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Credit Amount"
              value={form.credit}
              onChangeText={(text) => setForm(prev => ({ ...prev, credit: text }))}
              style={styles.textInput}
              keyboardType="numeric"
              placeholderTextColor="#888"
            />
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            
            {/* Add New Item */}
            <View style={styles.addItemContainer}>
              <TextInput
                placeholder="Add new item"
                value={newItem}
                onChangeText={setNewItem}
                style={[styles.textInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={handleAddItem} style={styles.addItemButton}>
                <MaterialIcons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Existing Items */}
            {allItems.length > 0 && (
              <View style={styles.existingItemsContainer}>
                <Text style={styles.existingItemsTitle}>Existing Items:</Text>
                <View style={styles.existingItemsList}>
                  {allItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelectExistingItem(item)}
                      style={styles.existingItemButton}
                    >
                      <Text style={styles.existingItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Selected Items */}
            {form.items.length > 0 && (
              <View style={styles.selectedItemsContainer}>
                <Text style={styles.selectedItemsTitle}>Selected Items:</Text>
                {form.items.map((item, index) => (
                  <View key={index} style={styles.selectedItemRow}>
                    <Text style={styles.selectedItemText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={styles.removeItemButton}
                    >
                      <MaterialIcons name="remove" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </Text>
          </TouchableOpacity>
        </KeyboardAwarePopup>
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
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  keyboardAwareContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addItemButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  existingItemsContainer: {
    marginBottom: 15,
  },
  existingItemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  existingItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  existingItemButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  existingItemText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedItemsContainer: {
    marginBottom: 15,
  },
  selectedItemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 8,
  },
  selectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  selectedItemText: {
    fontSize: 14,
    color: '#065f46',
    flex: 1,
  },
  removeItemButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 