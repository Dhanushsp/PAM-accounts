import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

interface Vendor {
  _id: string;
  name: string;
  contact: string;
  credit: number;
  items: string[];
}

interface AddPurchasePopupProps {
  token: string;
  onClose: () => void;
}

export default function AddPurchasePopup({ token, onClose }: AddPurchasePopupProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({
    item: '',
    vendor: '',
    quantity: '',
    unit: 'packs' as 'packs' | 'kgs',
    pricePerUnit: '',
    amountPaid: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  // Fetch vendors on component mount
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
      Alert.alert('Error', 'Failed to fetch vendors. Please check your connection and try again.');
    }
  };

  // Calculate totals
  const totalPurchasePrice = parseFloat(form.quantity) * parseFloat(form.pricePerUnit) || 0;
  const totalAmountToBePaid = (selectedVendor?.credit || 0) + totalPurchasePrice;
  const updatedCredit = totalAmountToBePaid - (parseFloat(form.amountPaid) || 0);

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setForm(prev => ({ ...prev, vendor: vendor._id }));
  };

  const handleSubmit = async () => {
    if (!form.item.trim()) {
      Alert.alert('Error', 'Please select an item');
      return;
    }

    if (!form.vendor) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!form.pricePerUnit || parseFloat(form.pricePerUnit) <= 0) {
      Alert.alert('Error', 'Please enter a valid price per unit');
      return;
    }

    if (!form.amountPaid || parseFloat(form.amountPaid) < 0) {
      Alert.alert('Error', 'Please enter a valid amount paid');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/purchases`, {
        item: form.item,
        vendor: form.vendor,
        vendorName: selectedVendor?.name,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        pricePerUnit: parseFloat(form.pricePerUnit),
        totalPrice: totalPurchasePrice,
        amountPaid: parseFloat(form.amountPaid),
        updatedCredit: updatedCredit,
        date: new Date().toISOString()
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });

      // Update vendor credit
      await axios.put(`${BACKEND_URL}/api/vendors/${form.vendor}`, {
        credit: updatedCredit
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });
      
      Alert.alert('Success', 'Purchase added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding purchase:', error);
      Alert.alert('Error', 'Failed to add purchase');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueItems = () => {
    const items = new Set<string>();
    vendors.forEach(vendor => {
      vendor.items.forEach(item => items.add(item));
    });
    return Array.from(items);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Purchase</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={18} color="#64748b" />
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.formContent}>
            {/* Item Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Item *</Text>
              {getUniqueItems().length === 0 ? (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    No items found. Please add items to vendors first.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScrollView}>
                  {getUniqueItems().map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setForm(prev => ({ ...prev, item }))}
                      style={[styles.itemButton, form.item === item && styles.selectedItemButton]}
                    >
                      <Text style={[styles.itemButtonText, form.item === item && styles.selectedItemButtonText]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Vendor Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Vendor *</Text>
              {vendors.length === 0 ? (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    No vendors found. Please add vendors first.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScrollView}>
                  {vendors.map((vendor) => (
                    <TouchableOpacity
                      key={vendor._id}
                      onPress={() => handleVendorSelect(vendor)}
                      style={[styles.itemButton, form.vendor === vendor._id && styles.selectedItemButton]}
                    >
                      <Text style={[styles.itemButtonText, form.vendor === vendor._id && styles.selectedItemButtonText]}>
                        {vendor.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Vendor Credit Display */}
            {selectedVendor && (
              <View style={styles.creditContainer}>
                <Text style={styles.creditText}>
                  Vendor Credit: ₹{selectedVendor.credit}
                </Text>
              </View>
            )}

            {/* Quantity and Unit */}
            <View style={styles.rowContainer}>
              <View style={styles.halfContainer}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChangeText={(text) => setForm(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>
              <View style={styles.halfContainer}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitContainer}>
                  <TouchableOpacity
                    onPress={() => setForm(prev => ({ ...prev, unit: 'packs' }))}
                    style={[styles.unitButton, form.unit === 'packs' && styles.selectedUnitButton]}
                  >
                    <Text style={[styles.unitButtonText, form.unit === 'packs' && styles.selectedUnitButtonText]}>
                      Packs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setForm(prev => ({ ...prev, unit: 'kgs' }))}
                    style={[styles.unitButton, form.unit === 'kgs' && styles.selectedUnitButton]}
                  >
                    <Text style={[styles.unitButtonText, form.unit === 'kgs' && styles.selectedUnitButtonText]}>
                      Kgs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Price per Unit */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Price per {form.unit} *</Text>
              <TextInput
                placeholder={`Enter price per ${form.unit}`}
                value={form.pricePerUnit}
                onChangeText={(text) => setForm(prev => ({ ...prev, pricePerUnit: text }))}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            {/* Total Purchase Price */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Purchase Price</Text>
              <Text style={styles.totalValue}>₹{totalPurchasePrice.toFixed(2)}</Text>
            </View>

            {/* Total Amount to be Paid */}
            <View style={styles.totalAmountContainer}>
              <Text style={styles.totalAmountLabel}>Total Amount to be Paid</Text>
              <Text style={styles.totalAmountValue}>₹{totalAmountToBePaid.toFixed(2)}</Text>
            </View>

            {/* Amount Paid */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount Paid *</Text>
              <TextInput
                placeholder="Enter amount paid"
                value={form.amountPaid}
                onChangeText={(text) => setForm(prev => ({ ...prev, amountPaid: text }))}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            {/* Updated Credit */}
            <View style={styles.updatedCreditContainer}>
              <Text style={styles.updatedCreditLabel}>Updated Credit</Text>
              <Text style={styles.updatedCreditValue}>₹{updatedCredit.toFixed(2)}</Text>
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
              {loading ? 'Adding...' : 'Purchase'}
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
    minHeight: 600,
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
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  itemsScrollView: {
    flexDirection: 'row',
  },
  itemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selectedItemButton: {
    backgroundColor: '#2563eb',
  },
  itemButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedItemButtonText: {
    color: '#ffffff',
  },
  creditContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
  },
  creditText: {
    fontSize: 14,
    color: '#1e40af',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  halfContainer: {
    flex: 1,
  },
  unitContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  selectedUnitButton: {
    backgroundColor: '#ffffff',
  },
  unitButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  selectedUnitButtonText: {
    color: '#2563eb',
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
  totalContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalAmountContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#1e40af',
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  updatedCreditContainer: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 12,
  },
  updatedCreditLabel: {
    fontSize: 14,
    color: '#065f46',
  },
  updatedCreditValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
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
    backgroundColor: '#059669',
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