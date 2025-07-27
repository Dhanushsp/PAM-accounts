import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

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
}

export default function AddIncomePopup({ token, onClose }: AddIncomePopupProps) {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);
  const [form, setForm] = useState({
    typeId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    newTypeName: '',
    isFromSavings: false,
    savingsTypeId: ''
  });
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<IncomeType | null>(null);
  const [selectedSavingsType, setSelectedSavingsType] = useState<SavingsType | null>(null);

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

  const handleTypeSelect = (type: IncomeType) => {
    setSelectedType(type);
    setForm(prev => ({ ...prev, typeId: type._id }));
    setShowNewTypeInput(false);
  };

  const handleSavingsTypeSelect = (type: SavingsType) => {
    setSelectedSavingsType(type);
    setForm(prev => ({ 
      ...prev, 
      savingsTypeId: type._id,
      isFromSavings: true 
    }));
  };

  const handleAddNewType = () => {
    if (!form.newTypeName.trim()) {
      Alert.alert('Error', 'Please enter a type name');
      return;
    }

    setShowNewTypeInput(false);
  };

  const handleSubmit = async () => {
    if (!form.typeId && !form.newTypeName.trim()) {
      Alert.alert('Error', 'Please select an income type or create a new one');
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (form.isFromSavings && !form.savingsTypeId) {
      Alert.alert('Error', 'Please select a savings type');
      return;
    }

    try {
      setLoading(true);
      
      let typeId = form.typeId;
      
      // If creating a new type
      if (!typeId && form.newTypeName.trim()) {
        const newTypeResponse = await axios.post(`${BACKEND_URL}/api/income-types`, {
          name: form.newTypeName.trim()
        }, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token 
          }
        });
        typeId = newTypeResponse.data._id;
      }

      // Add income entry
      await axios.post(`${BACKEND_URL}/api/income-entries`, {
        typeId,
        date: form.date,
        amount: parseFloat(form.amount),
        isFromSavings: form.isFromSavings,
        savingsTypeId: form.savingsTypeId
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });
      
      Alert.alert('Success', 'Income added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('Error', 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTotal = () => {
    if (selectedType) {
      return selectedType.totalAmount;
    }
    return 0;
  };

  const getNewTotal = () => {
    const currentTotal = getCurrentTotal();
    const newAmount = parseFloat(form.amount) || 0;
    return currentTotal + newAmount;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Income</Text>
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
            {/* Income Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Income Type *</Text>
              
              {!showNewTypeInput ? (
                <View>
                  {/* Existing Types */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScrollView}>
                    {incomeTypes.map((type) => (
                      <TouchableOpacity
                        key={type._id}
                        onPress={() => handleTypeSelect(type)}
                        style={[styles.typeButton, form.typeId === type._id && styles.selectedTypeButton]}
                      >
                        <Text style={[styles.typeButtonText, form.typeId === type._id && styles.selectedTypeButtonText]}>
                          {type.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Add New Type Button */}
                  <TouchableOpacity
                    onPress={() => setShowNewTypeInput(true)}
                    style={styles.addTypeButton}
                  >
                    <MaterialIcons name="add" size={18} color="#2563eb" />
                    <Text style={styles.addTypeButtonText}>Add New Type</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.newTypeContainer}>
                  <TextInput
                    placeholder="Enter new type name"
                    value={form.newTypeName}
                    onChangeText={(text) => setForm(prev => ({ ...prev, newTypeName: text }))}
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={handleAddNewType}
                    style={styles.confirmTypeButton}
                  >
                    <MaterialIcons name="check" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={form.date}
                onChangeText={(text) => setForm(prev => ({ ...prev, date: text }))}
                style={styles.textInput}
              />
            </View>

            {/* Current Total */}
            {selectedType && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Current Total in {selectedType.name}</Text>
                <Text style={styles.totalAmount}>₹{getCurrentTotal().toLocaleString()}</Text>
              </View>
            )}

            {/* Amount */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                placeholder="Enter amount"
                value={form.amount}
                onChangeText={(text) => setForm(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            {/* New Total */}
            {selectedType && form.amount && (
              <View style={styles.newTotalContainer}>
                <Text style={styles.newTotalLabel}>New Total in {selectedType.name}</Text>
                <Text style={styles.newTotalAmount}>₹{getNewTotal().toLocaleString()}</Text>
              </View>
            )}

            {/* Source Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Source</Text>
              <View style={styles.sourceContainer}>
                <TouchableOpacity
                  onPress={() => setForm(prev => ({ ...prev, isFromSavings: false, savingsTypeId: '' }))}
                  style={[styles.sourceButton, !form.isFromSavings && styles.selectedSourceButton]}
                >
                  <Text style={[styles.sourceButtonText, !form.isFromSavings && styles.selectedSourceButtonText]}>
                    External
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForm(prev => ({ ...prev, isFromSavings: true }))}
                  style={[styles.sourceButton, form.isFromSavings && styles.selectedSourceButton]}
                >
                  <Text style={[styles.sourceButtonText, form.isFromSavings && styles.selectedSourceButtonText]}>
                    From Savings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Savings Type Selection (if from savings) */}
            {form.isFromSavings && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Savings Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScrollView}>
                  {savingsTypes.map((type) => (
                    <TouchableOpacity
                      key={type._id}
                      onPress={() => handleSavingsTypeSelect(type)}
                      style={[styles.typeButton, form.savingsTypeId === type._id && styles.selectedTypeButton]}
                    >
                      <Text style={[styles.typeButtonText, form.savingsTypeId === type._id && styles.selectedTypeButtonText]}>
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedSavingsType && (
                  <View style={styles.savingsWarning}>
                    <Text style={styles.savingsWarningText}>
                      This amount will be deducted from {selectedSavingsType.name} savings
                    </Text>
                  </View>
                )}
              </View>
            )}
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
              {loading ? 'Adding...' : 'Add Income'}
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
  typesScrollView: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTypeButtonText: {
    color: '#ffffff',
  },
  addTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  addTypeButtonText: {
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 8,
  },
  newTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
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
  confirmTypeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#166534',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  newTotalContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
  },
  newTotalLabel: {
    fontSize: 14,
    color: '#1e40af',
  },
  newTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  sourceContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  sourceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  selectedSourceButton: {
    backgroundColor: '#ffffff',
  },
  sourceButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  selectedSourceButtonText: {
    color: '#2563eb',
  },
  savingsWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  savingsWarningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
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