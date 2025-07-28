import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import KeyboardAwarePopup from './KeyboardAwarePopup';

interface Vendor {
  _id: string;
  name: string;
  credit: number;
  items: string[];
}

interface AddPurchasePopupProps {
  token: string;
  onClose: () => void;
}

export default function AddPurchasePopup({ token, onClose }: AddPurchasePopupProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'packs' | 'kgs'>('packs');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/vendors`, {
        headers: { Authorization: token }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('No vendors found. Please add vendors first.');
    }
  };

  const getTotalPrice = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    return qty * price;
  };

  const getTotalAmountToBePaid = () => {
    const totalPrice = getTotalPrice();
    const vendorCredit = selectedVendor ? selectedVendor.credit : 0;
    return totalPrice + vendorCredit;
  };

  const getUpdatedCredit = () => {
    const totalAmount = getTotalAmountToBePaid();
    const paid = parseFloat(amountPaid) || 0;
    return totalAmount - paid;
  };

  const getAvailableItems = () => {
    if (!selectedVendor) return [];
    return selectedVendor.items;
  };

  const handleSubmit = async () => {
    if (!selectedVendor) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }
    if (!selectedItem) {
      Alert.alert('Error', 'Please select an item');
      return;
    }
    if (!quantity || !pricePerUnit) {
      Alert.alert('Error', 'Please fill in quantity and price');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        item: selectedItem,
        vendor: selectedVendor._id,
        vendorName: selectedVendor.name,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        totalPrice: getTotalPrice(),
        amountPaid: parseFloat(amountPaid) || 0,
        updatedCredit: getUpdatedCredit(),
        date: new Date()
      };

      await axios.post(`${BACKEND_URL}/api/purchases`, purchaseData, {
        headers: { Authorization: token }
      });

      // Update vendor credit
      await axios.put(`${BACKEND_URL}/api/vendors/${selectedVendor._id}`, {
        credit: getUpdatedCredit()
      }, {
        headers: { Authorization: token }
      });

      Alert.alert('Success', 'Purchase added successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error adding purchase:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Purchase</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAwarePopup
          style={styles.keyboardAwareContainer}
          contentContainerStyle={styles.contentContainer}
          extraScrollHeight={100}
        >
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Vendor Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Vendor</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  // Show vendor selection modal or dropdown
                  if (vendors.length === 0) {
                    Alert.alert('No Vendors', 'Please add vendors first');
                  } else {
                    // For now, just select the first vendor
                    setSelectedVendor(vendors[0]);
                  }
                }}
              >
                <Text style={styles.dropdownText}>
                  {selectedVendor ? selectedVendor.name : 'Select Vendor'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedVendor && (
              <Text style={styles.creditText}>
                Current Credit: ₹{selectedVendor.credit.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Item Selection */}
          {selectedVendor && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Item</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    const items = getAvailableItems();
                    if (items.length === 0) {
                      Alert.alert('No Items', 'This vendor has no items');
                    } else {
                      setSelectedItem(items[0]);
                    }
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {selectedItem || 'Select Item'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Purchase Details */}
          {selectedItem && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Purchase Details</Text>
              
              {/* Unit Selection */}
              <View style={styles.unitContainer}>
                <Text style={styles.label}>Unit:</Text>
                <View style={styles.unitButtons}>
                  {(['packs', 'kgs'] as const).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitButton, unit === u && styles.unitButtonActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitButtonText, unit === u && styles.unitButtonTextActive]}>
                        {u.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quantity */}
              <TextInput
                placeholder={`Quantity (${unit})`}
                value={quantity}
                onChangeText={setQuantity}
                style={styles.textInput}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              {/* Price per Unit */}
              <TextInput
                placeholder={`Price per ${unit.slice(0, -1)}`}
                value={pricePerUnit}
                onChangeText={setPricePerUnit}
                style={styles.textInput}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              {/* Total Price (Read-only) */}
              <View style={styles.readOnlyContainer}>
                <Text style={styles.label}>Total Purchase Price:</Text>
                <Text style={styles.readOnlyValue}>₹{getTotalPrice().toFixed(2)}</Text>
              </View>

              {/* Total Amount to be Paid */}
              <View style={styles.readOnlyContainer}>
                <Text style={styles.label}>Total Amount to be Paid:</Text>
                <Text style={styles.readOnlyValue}>₹{getTotalAmountToBePaid().toFixed(2)}</Text>
              </View>

              {/* Amount Paid */}
              <TextInput
                placeholder="Amount Paid"
                value={amountPaid}
                onChangeText={setAmountPaid}
                style={styles.textInput}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              {/* Updated Credit (Read-only) */}
              <View style={styles.readOnlyContainer}>
                <Text style={styles.label}>Updated Credit:</Text>
                <Text style={styles.readOnlyValue}>₹{getUpdatedCredit().toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !selectedVendor || !selectedItem}
            style={[styles.submitButton, (loading || !selectedVendor || !selectedItem) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Purchase'}
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
    minHeight: 600,
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
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
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
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  creditText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  unitContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
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
  readOnlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
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