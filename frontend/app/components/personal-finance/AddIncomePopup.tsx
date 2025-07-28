import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import KeyboardAwarePopup from '../KeyboardAwarePopup';

interface IncomeType {
  _id: string;
  name: string;
  totalAmount: number;
}

interface SavingsType {
  _id: string;
  name: string;
  totalAmount: number;
}

interface AddIncomePopupProps {
  token: string;
  onClose: () => void;
  onIncomeAdded: () => void;
}

export default function AddIncomePopup({ token, onClose, onIncomeAdded }: AddIncomePopupProps) {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);
  const [selectedType, setSelectedType] = useState<IncomeType | null>(null);
  const [selectedSavingsType, setSelectedSavingsType] = useState<SavingsType | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFromSavings, setIsFromSavings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchIncomeTypes();
    fetchSavingsTypes();
  }, []);

  const fetchIncomeTypes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/income-types`, {
        headers: { Authorization: token }
      });
      setIncomeTypes(response.data);
    } catch (error) {
      console.error('Error fetching income types:', error);
      Alert.alert('Error', 'Failed to fetch income types');
    }
  };

  const fetchSavingsTypes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/savings-types`, {
        headers: { Authorization: token }
      });
      setSavingsTypes(response.data);
    } catch (error) {
      console.error('Error fetching savings types:', error);
    }
  };

  const handleAddNewType = async () => {
    if (!newTypeName.trim()) {
      Alert.alert('Error', 'Please enter a type name');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/income-types`, {
        name: newTypeName.trim()
      }, {
        headers: { Authorization: token }
      });

      const newType = response.data;
      setIncomeTypes(prev => [...prev, newType]);
      setSelectedType(newType);
      setNewTypeName('');
      setShowNewTypeInput(false);
    } catch (error: any) {
      console.error('Error adding income type:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add income type');
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an income type');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const incomeData = {
        typeId: selectedType._id,
        amount: parseFloat(amount),
        date: new Date(date),
        isFromSavings,
        savingsTypeId: isFromSavings && selectedSavingsType ? selectedSavingsType._id : null
      };

      await axios.post(`${BACKEND_URL}/api/income-entries`, incomeData, {
        headers: { Authorization: token }
      });

      // If income is from savings, deduct from savings
      if (isFromSavings && selectedSavingsType) {
        await axios.post(`${BACKEND_URL}/api/savings-entries`, {
          typeId: selectedSavingsType._id,
          amount: -parseFloat(amount), // Negative amount to deduct
          date: new Date(date)
        }, {
          headers: { Authorization: token }
        });
      }

      Alert.alert('Success', 'Income entry added successfully!');
      onIncomeAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding income entry:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add income entry');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTotal = () => {
    return selectedType ? selectedType.totalAmount : 0;
  };

  const getNewTotal = () => {
    const currentTotal = getCurrentTotal();
    const newAmount = parseFloat(amount) || 0;
    return currentTotal + newAmount;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Income</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAwarePopup
          style={styles.keyboardAwareContainer}
          contentContainerStyle={styles.contentContainer}
          extraScrollHeight={100}
        >
          {/* Income Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Type</Text>
            
            {!showNewTypeInput ? (
              <View style={styles.typeSelectionContainer}>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      if (incomeTypes.length === 0) {
                        setShowNewTypeInput(true);
                      }
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedType ? selectedType.name : 'Select Type'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowNewTypeInput(true)}
                  style={styles.addTypeButton}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newTypeContainer}>
                <TextInput
                  placeholder="Enter new type name"
                  value={newTypeName}
                  onChangeText={setNewTypeName}
                  style={styles.textInput}
                  placeholderTextColor="#888"
                />
                <View style={styles.newTypeButtons}>
                  <TouchableOpacity
                    onPress={handleAddNewType}
                    style={styles.saveTypeButton}
                  >
                    <Text style={styles.saveTypeButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowNewTypeInput(false);
                      setNewTypeName('');
                    }}
                    style={styles.cancelTypeButton}
                  >
                    <Text style={styles.cancelTypeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Type List */}
            {incomeTypes.length > 0 && !showNewTypeInput && (
              <View style={styles.typeList}>
                {incomeTypes.map((type) => (
                  <TouchableOpacity
                    key={type._id}
                    onPress={() => setSelectedType(type)}
                    style={[styles.typeItem, selectedType?._id === type._id && styles.selectedTypeItem]}
                  >
                    <Text style={[styles.typeItemText, selectedType?._id === type._id && styles.selectedTypeItemText]}>
                      {type.name}
                    </Text>
                    <Text style={[styles.typeItemAmount, selectedType?._id === type._id && styles.selectedTypeItemAmount]}>
                      ₹{type.totalAmount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* From Savings Option */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            
            <TouchableOpacity
              onPress={() => setIsFromSavings(!isFromSavings)}
              style={[styles.checkboxContainer, isFromSavings && styles.checkboxContainerActive]}
            >
              <View style={[styles.checkbox, isFromSavings && styles.checkboxActive]}>
                {isFromSavings && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>From Savings</Text>
            </TouchableOpacity>

            {isFromSavings && savingsTypes.length > 0 && (
              <View style={styles.savingsTypeContainer}>
                <Text style={styles.label}>Select Savings Type:</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      if (savingsTypes.length > 0) {
                        setSelectedSavingsType(savingsTypes[0]);
                      }
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedSavingsType ? selectedSavingsType.name : 'Select Savings Type'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                {selectedSavingsType && (
                  <Text style={styles.savingsInfo}>
                    Current Savings: ₹{selectedSavingsType.totalAmount.toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Amount and Date */}
          {selectedType && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                style={styles.textInput}
                placeholderTextColor="#888"
              />

              <TextInput
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                style={styles.textInput}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              {/* Current Total */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Current Total:</Text>
                <Text style={styles.totalValue}>₹{getCurrentTotal().toFixed(2)}</Text>
              </View>

              {/* New Total */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>New Total:</Text>
                <Text style={styles.totalValue}>₹{getNewTotal().toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !selectedType || !amount || (isFromSavings && !selectedSavingsType)}
            style={[styles.submitButton, (loading || !selectedType || !amount || (isFromSavings && !selectedSavingsType)) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Income'}
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
  typeSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  dropdownContainer: {
    flex: 1,
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
  addTypeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTypeContainer: {
    marginBottom: 15,
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
  newTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  saveTypeButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelTypeButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  typeList: {
    gap: 8,
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedTypeItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  typeItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedTypeItemText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  typeItemAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedTypeItemAmount: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxContainerActive: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  savingsTypeContainer: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  savingsInfo: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
  totalContainer: {
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
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalValue: {
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