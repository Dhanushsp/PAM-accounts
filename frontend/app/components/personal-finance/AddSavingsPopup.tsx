import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Pressable, 
  StyleSheet, 
  Alert, 
  Keyboard, 
  Dimensions, 
  ScrollView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import apiClient from '../../lib/axios-config';

interface SavingsType {
  _id: string;
  name: string;
  totalAmount: number;
}

interface AddSavingsPopupProps {
  token: string;
  onClose: () => void;
  onSavingsAdded?: () => void;
}

export default function AddSavingsPopup({ token, onClose, onSavingsAdded }: AddSavingsPopupProps) {
  const [selectedType, setSelectedType] = useState<any>(null);
  const [newType, setNewType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingsTypes, setSavingsTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  useEffect(() => {
    // Set initial screen height
    setScreenHeight(Dimensions.get('window').height);

    // Add keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    // Cleanup listeners
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    fetchSavingsTypes();
  }, []);

  const fetchSavingsTypes = async () => {
    try {
      const response = await apiClient.get(`/api/savings-types`);
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
      const response = await apiClient.post(`/api/savings-types`, {
        name: newType.trim()
      });

      const createdType = response.data;
      setSavingsTypes(prev => [...prev, createdType]);
      setSelectedType(createdType);
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
      await apiClient.post(`/api/savings-entries`, {
        typeId: selectedType._id,
        amount: parseFloat(amount),
        date: new Date(date)
      });

      Alert.alert('Success', 'Savings entry added successfully!');
      onSavingsAdded?.();
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

  // Calculate dynamic heights based on keyboard state
  const availableHeight = screenHeight - keyboardHeight - 60; // Increased margin to ensure button visibility
  const containerMaxHeight = keyboardVisible 
    ? Math.min(availableHeight - 60, screenHeight * 0.5) // Reduced to 50% max when keyboard is open
    : screenHeight * 0.95;
  const scrollViewHeight = keyboardVisible 
    ? availableHeight - 200 // Much more space for header, padding, and button
    : '80%';
  const dropdownMaxHeight = keyboardVisible ? 60 : 160;

  return (
    <View style={styles.overlay}>
      <View style={[
        styles.keyboardAvoidingTop,
        keyboardVisible && {
          justifyContent: 'flex-start', // When keyboard is open, align to top of available space
          paddingTop: 20, // Keep some padding from top
        }
      ]}>
        <View style={[
          styles.container, 
          { maxHeight: containerMaxHeight }, 
          styles.containerTop,
          keyboardVisible && {
            marginBottom: 0, // Remove any bottom margin when keyboard is open
            marginTop: 0, // Keep at top when keyboard is open
          }
        ]}>
          {/* Close button */}
          <Pressable onPress={onClose} style={[styles.closeButton, { elevation: 3 }]}>
            <MaterialIcons name="close" size={22} color="#64748b" />
          </Pressable>

          <Text style={styles.title}>Add Savings</Text>

          <ScrollView
            style={[styles.scrollView, { height: scrollViewHeight }]}
            contentContainerStyle={[
              { flexGrow: 1 },
              keyboardVisible && { paddingBottom: 20 } // Extra padding when keyboard is open
            ]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {/* Savings Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Savings Type</Text>
              
              {!showNewTypeInput ? (
                <View style={styles.savingsTypesSection}>
                  <View style={styles.savingsTypesHeader}>
                    <Text style={styles.savingsTypesLabel}>Select Savings Type:</Text>
                    <TouchableOpacity
                      onPress={() => setShowNewTypeInput(true)}
                      style={styles.addTypeButton}
                    >
                      <MaterialIcons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Horizontal Savings Type Buttons */}
                  {savingsTypes.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalTypeList}
                      contentContainerStyle={styles.horizontalTypeListContent}
                    >
                      {savingsTypes.map((type) => (
                        <TouchableOpacity
                          key={type._id}
                          onPress={() => setSelectedType(type)}
                          style={[
                            styles.horizontalTypeButton, 
                            selectedType?._id === type._id && styles.selectedHorizontalTypeButton
                          ]}
                        >
                          <Text style={[
                            styles.horizontalTypeButtonText, 
                            selectedType?._id === type._id && styles.selectedHorizontalTypeButtonText
                          ]}>
                            {type.name}
                          </Text>
                          <Text style={[
                            styles.horizontalTypeButtonAmount, 
                            selectedType?._id === type._id && styles.selectedHorizontalTypeButtonAmount
                          ]}>
                            ₹{(type.totalAmount || 0).toFixed(0)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
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
              style={[
                styles.submitButton, 
                (loading || !selectedType || !amount) && styles.submitButtonDisabled,
                keyboardVisible && { marginBottom: 40 } // Extra space when keyboard is open
              ]}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Savings'}
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoidingTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start', // Default: start at top
    paddingTop: 20,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Ensure it covers full height
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
    marginTop: 0
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
    paddingBottom: 8,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    flexGrow: 1, // Allow content to grow
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdown: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
  newTypeContainer: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#000',
    fontSize: 16,
  },
  newTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveTypeButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
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
    paddingVertical: 12,
    borderRadius: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
    color: '#059669',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20, // Add bottom margin for gap from screen bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  // New styles for horizontal type listing
  savingsTypesSection: {
    marginBottom: 16,
  },
  savingsTypesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  savingsTypesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  horizontalTypeList: {
    maxHeight: 80,
  },
  horizontalTypeListContent: {
    paddingRight: 16,
  },
  horizontalTypeButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedHorizontalTypeButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  horizontalTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedHorizontalTypeButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  horizontalTypeButtonAmount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedHorizontalTypeButtonAmount: {
    color: '#2563eb',
    fontWeight: '500',
  },
}); 