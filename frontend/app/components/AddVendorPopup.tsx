import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
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
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

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
    fetchAllItems();
  }, []);

  const fetchAllItems = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/items`, {
        headers: { Authorization: token }
      });
      setAvailableItems(response.data.items || []);
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

  const handleRemoveItem = (item: string) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((i) => i !== item)
    }));
  };

  const handleItemSelect = (item: string) => {
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

          <Text style={styles.title}>Add Vendor</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                placeholder="Vendor Name"
                value={form.name}
                onChangeText={(text) => setForm({...form, name: text})}
                style={styles.input}
                placeholderTextColor="#888"
              />

              <TextInput
                placeholder="Contact Number"
                value={form.contact}
                onChangeText={(text) => setForm({...form, contact: text})}
                style={styles.input}
                placeholderTextColor="#888"
              />

              <TextInput
                placeholder="Credit Amount"
                value={form.credit}
                onChangeText={(text) => setForm({...form, credit: text})}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#888"
              />
            </View>

            {/* Items Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              
              {/* Add New Item */}
              <View style={styles.addItemRow}>
                <TextInput
                  placeholder="Add new item"
                  value={newItem}
                  onChangeText={setNewItem}
                  style={styles.addItemInput}
                  placeholderTextColor="#888"
                />
                <TouchableOpacity onPress={handleAddItem} style={styles.addItemButton}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Existing Items */}
              {availableItems.length > 0 && (
                <View style={styles.existingItemsContainer}>
                  <Text style={styles.existingItemsTitle}>Existing Items:</Text>
                  <View style={styles.existingItemsList}>
                    {availableItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleItemSelect(item)}
                        style={[
                          styles.itemChip,
                          form.items.includes(item) && styles.itemChipSelected
                        ]}
                      >
                        <Text style={[
                          styles.itemChipText,
                          form.items.includes(item) && styles.itemChipTextSelected
                        ]}>
                          {item}
                        </Text>
                        {form.items.includes(item) && (
                          <MaterialIcons name="check" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Selected Items */}
              {form.items.length > 0 && (
                <View style={styles.selectedItemsContainer}>
                  <Text style={styles.selectedItemsTitle}>Selected Items:</Text>
                  <View style={styles.selectedItemsList}>
                    {form.items.map((item, index) => (
                      <View key={index} style={styles.selectedItemChip}>
                        <Text style={styles.selectedItemChipText}>{item}</Text>
                        <TouchableOpacity onPress={() => handleRemoveItem(item)}>
                          <MaterialIcons name="close" size={16} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
    alignSelf: 'flex-end',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 15,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
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
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addItemInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#000',
    fontSize: 16,
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
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  itemChipText: {
    fontSize: 14,
    color: '#374151',
  },
  itemChipTextSelected: {
    color: '#fff',
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
  selectedItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  selectedItemChipText: {
    fontSize: 14,
    color: '#065f46',
    marginRight: 8,
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
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
}); 