import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface MoneyLentType {
  _id: string;
  name: string;
  totalAmount: number;
}

interface AddMoneyLentPopupProps {
  token: string;
  onClose: () => void;
}

export default function AddMoneyLentPopup({ token, onClose }: AddMoneyLentPopupProps) {
  const [moneyLentTypes, setMoneyLentTypes] = useState<MoneyLentType[]>([]);
  const [form, setForm] = useState({
    typeId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    newTypeName: ''
  });
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<MoneyLentType | null>(null);

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchMoneyLentTypes();
  }, []);

  const fetchMoneyLentTypes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/money-lent-types`, {
        headers: { Authorization: token }
      });
      setMoneyLentTypes(response.data);
    } catch (error) {
      console.error('Error fetching money lent types:', error);
    }
  };

  const handleTypeSelect = (type: MoneyLentType) => {
    setSelectedType(type);
    setForm(prev => ({ ...prev, typeId: type._id }));
    setShowNewTypeInput(false);
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
      Alert.alert('Error', 'Please select a money lent type or create a new one');
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      let typeId = form.typeId;
      
      // If creating a new type
      if (!typeId && form.newTypeName.trim()) {
        const newTypeResponse = await axios.post(`${BACKEND_URL}/api/money-lent-types`, {
          name: form.newTypeName.trim()
        }, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token 
          }
        });
        typeId = newTypeResponse.data._id;
      }

      // Add money lent entry
      await axios.post(`${BACKEND_URL}/api/money-lent-entries`, {
        typeId,
        date: form.date,
        amount: parseFloat(form.amount)
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        }
      });
      
      Alert.alert('Success', 'Money lent added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding money lent:', error);
      Alert.alert('Error', 'Failed to add money lent');
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
          <Text style={styles.headerTitle}>Add Money Lent</Text>
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
            {/* Money Lent Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Money Lent Type *</Text>
              
              {!showNewTypeInput ? (
                <View>
                  {/* Existing Types */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScrollView}>
                    {moneyLentTypes.map((type) => (
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
              <Text style={styles.label}>Amount to Add *</Text>
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
              {loading ? 'Adding...' : 'Add Money Lent'}
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
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    padding: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#581c87',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#581c87',
  },
  newTotalContainer: {
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    padding: 12,
  },
  newTotalLabel: {
    fontSize: 14,
    color: '#6b21a8',
  },
  newTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b21a8',
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
    backgroundColor: '#7c3aed',
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