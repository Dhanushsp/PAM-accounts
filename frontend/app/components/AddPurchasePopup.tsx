import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { KeyboardAvoidingView, Platform } from 'react-native';import apiClient from '../../lib/axios-config';



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
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'packs' | 'kgs'>('packs');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Keyboard detection
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();

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
  const availableHeight = screenHeight - keyboardHeight - insets.top - insets.bottom - 40;
  const containerMaxHeight = keyboardVisible 
    ? Math.min(screenHeight * 0.85, availableHeight) // Use more available space when at top
    : screenHeight * 0.95;

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      console.log('Fetching vendors...');
      const response = await apiClient.get(`/api/vendors`);
      console.log('Vendors fetched:', response.data);
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

      await apiClient.post(`/api/purchases`, purchaseData);

      // Update vendor credit
      await apiClient.put(`/api/vendors/${selectedVendor._id}`, {
        credit: getUpdatedCredit()
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
    <View style={[
      styles.overlay,
      keyboardVisible && {
        justifyContent: 'flex-start',
        paddingTop: insets.top,
      }
    ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[
          styles.container, 
          { 
            maxHeight: containerMaxHeight,
            minHeight: keyboardVisible ? Math.min(screenHeight * 0.6, availableHeight) : undefined
          }
        ]}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color="#64748b" />
          </Pressable>

          <Text style={styles.title}>Add Purchase</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={false}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            automaticallyAdjustKeyboardInsets={true}
            keyboardDismissMode="interactive"
          >
            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Item Selection */}
            <Text style={styles.label}>Select Item</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowItemModal(true)}
            >
              <Text style={selectedItem ? styles.dropdownText : styles.dropdownPlaceholder}>
                {selectedItem || 'Select an item'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Vendor Selection */}
            <Text style={styles.label}>Select Vendor</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowVendorModal(true)}
            >
              <Text style={selectedVendor ? styles.dropdownText : styles.dropdownPlaceholder}>
                {selectedVendor ? selectedVendor.name : 'Select a vendor'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Vendor Credit Display */}
            {selectedVendor && (
              <Text style={styles.creditText}>
                Current Credit: ₹{selectedVendor.credit.toFixed(2)}
              </Text>
            )}

            {/* Quantity and Unit */}
            <View style={styles.rowAlignCenter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'packs' && styles.unitButtonActive]}
                    onPress={() => setUnit('packs')}
                  >
                    <Text style={[styles.unitButtonText, unit === 'packs' && styles.unitButtonTextActive]}>
                      Packs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'kgs' && styles.unitButtonActive]}
                    onPress={() => setUnit('kgs')}
                  >
                    <Text style={[styles.unitButtonText, unit === 'kgs' && styles.unitButtonTextActive]}>
                      Kgs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Price per Unit */}
            <Text style={styles.label}>Price per {unit === 'packs' ? 'Pack' : 'Kg'}</Text>
            <TextInput
              style={styles.input}
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              placeholder={`Enter price per ${unit === 'packs' ? 'pack' : 'kg'}`}
              keyboardType="numeric"
              placeholderTextColor="#888"
            />

            {/* Calculations Display */}
            <View style={styles.calculationsContainer}>
              <Text style={styles.calculationText}>
                Total Purchase Price: ₹{getTotalPrice().toFixed(2)}
              </Text>
              <Text style={styles.calculationText}>
                Total Amount to be Paid: ₹{getTotalAmountToBePaid().toFixed(2)}
              </Text>
            </View>

            {/* Amount Paid */}
            <Text style={styles.label}>Amount Paid</Text>
            <TextInput
              style={styles.input}
              value={amountPaid}
              onChangeText={setAmountPaid}
              placeholder="Enter amount paid"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />

            {/* Updated Credit Display */}
            <Text style={styles.updatedCreditText}>
              Updated Credit: ₹{getUpdatedCredit().toFixed(2)}
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Purchase'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Vendor Selection Modal */}
          {showVendorModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Vendor</Text>
                  <TouchableOpacity onPress={() => setShowVendorModal(false)}>
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScrollView}>
                  {vendors.length > 0 ? (
                    vendors.map((vendor) => (
                      <TouchableOpacity
                        key={vendor._id}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedVendor(vendor);
                          setSelectedItem(''); // Reset item when vendor changes
                          setShowVendorModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{vendor.name}</Text>
                        <Text style={styles.modalItemSubtext}>Credit: ₹{vendor.credit.toFixed(2)}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.modalItemText}>No vendors available</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Item Selection Modal */}
          {showItemModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Item</Text>
                  <TouchableOpacity onPress={() => setShowItemModal(false)}>
                    <MaterialIcons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScrollView}>
                  {getAvailableItems().length > 0 ? (
                    getAvailableItems().map((item: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedItem(item);
                          setShowItemModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.modalItemText}>No items available for this vendor</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  keyboardAvoidingContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  container: {
    backgroundColor: '#fff',
    width: '92%',
    maxWidth: 480,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    paddingVertical: 20,
    flex: 1,
    maxHeight: '95%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textAlign: 'center',
    paddingTop: 28,
    paddingBottom: 12,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    flex: 1,
    minHeight: 0,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
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
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#888',
    flex: 1,
  },
  creditText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  unitContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  unitButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
  },
  unitButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#374151',
  },
  unitButtonTextActive: {
    color: '#1d4ed8',
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
  calculationsContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  calculationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  updatedCreditText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginTop: 10,
    marginBottom: 16,
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
  rowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  modalScrollView: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
}); 