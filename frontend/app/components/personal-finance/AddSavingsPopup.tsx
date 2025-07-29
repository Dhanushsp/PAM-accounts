import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert, Keyboard, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface SavingsType {
  _id: string;
  name: string;
  totalAmount: number;
}

interface AddSavingsPopupProps {
  token: string;
  onClose: () => void;
  onSavingsAdded: () => void;
}

export default function AddSavingsPopup({ token, onClose, onSavingsAdded }: AddSavingsPopupProps) {
  const [selectedType, setSelectedType] = useState<any>(null);
  const [newType, setNewType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingsTypes, setSavingsTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

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
    ? Math.min(screenHeight * 0.85, availableHeight)
    : screenHeight * 0.95;

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchSavingsTypes();
  }, []);

  const fetchSavingsTypes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/savings-types`, {
        headers: { Authorization: token }
      });
      setSavingsTypes(response.data);
    } catch (error) {
      console.error('Error fetching savings types:', error);
      Alert.alert('Error', 'Failed to fetch savings types');
    }
  };

  const handleAddNewType = async () => {
    if (!newType.trim()) {
      Alert.alert('Error', 'Please enter a type name');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/savings-types`, {
        name: newType.trim()
      }, {
        headers: { Authorization: token }
      });

      const newType = response.data;
      setSavingsTypes(prev => [...prev, newType]);
      setSelectedType(newType);
      setNewType('');
      setShowNewTypeInput(false);
    } catch (error: any) {
      console.error('Error adding savings type:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add savings type');
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a savings type');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/savings-entries`, {
        typeId: selectedType._id,
        amount: parseFloat(amount),
        date: new Date(date)
      }, {
        headers: { Authorization: token }
      });

      Alert.alert('Success', 'Savings entry added successfully!');
      onSavingsAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding savings entry:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add savings entry');
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

          <Text style={styles.title}>Add Savings</Text>

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
          {/* Savings Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Savings Type</Text>
            
            {!showNewTypeInput ? (
              <View style={styles.typeSelectionContainer}>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      if (savingsTypes.length === 0) {
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
                  value={newType}
                  onChangeText={setNewType}
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
                      setNewType('');
                    }}
                    style={styles.cancelTypeButton}
                  >
                    <Text style={styles.cancelTypeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Type List */}
            {savingsTypes.length > 0 && !showNewTypeInput && (
              <View style={styles.typeList}>
                {savingsTypes.map((type) => (
                  <TouchableOpacity
                    key={type._id}
                    onPress={() => setSelectedType(type)}
                    style={[styles.typeItem, selectedType?._id === type._id && styles.selectedTypeItem]}
                  >
                    <Text style={[styles.typeItemText, selectedType?._id === type._id && styles.selectedTypeItemText]}>
                      {type.name}
                    </Text>
                    <Text style={[styles.typeItemAmount, selectedType?._id === type._id && styles.selectedTypeItemAmount]}>
                      ₹{(type.totalAmount || 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                <Text style={styles.totalValue}>₹{(getCurrentTotal() || 0).toFixed(2)}</Text>
              </View>

              {/* New Total */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>New Total:</Text>
                <Text style={styles.totalValue}>₹{(getNewTotal() || 0).toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !selectedType || !amount}
            style={[styles.submitButton, (loading || !selectedType || !amount) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Savings'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    justifyContent: 'center',
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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