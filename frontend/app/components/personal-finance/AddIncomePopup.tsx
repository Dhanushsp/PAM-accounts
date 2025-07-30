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
  onIncomeAdded?: () => void;
}

export default function AddIncomePopup({ token, onClose, onIncomeAdded }: AddIncomePopupProps) {
  const [selectedType, setSelectedType] = useState<any>(null);
  const [newType, setNewType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeTypes, setIncomeTypes] = useState<any[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [isFromSavings, setIsFromSavings] = useState(false);
  const [selectedSavingsType, setSelectedSavingsType] = useState<any>(null);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

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
    if (!newType.trim()) {
      Alert.alert('Error', 'Please enter a type name');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/income-types`, {
        name: newType.trim()
      }, {
        headers: { Authorization: token }
      });

      const createdType = response.data;
      setIncomeTypes(prev => [...prev, createdType]);
      setSelectedType(createdType);
      setNewType('');
      setShowNewTypeInput(false);
    } catch (error: any) {
      console.error('Error adding income type:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add income type');
    }
  };

  const handleSubmit = async () => {
    if (!selectedType && !isFromSavings) {
      Alert.alert('Error', 'Please select an income type or choose "From Savings"');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (isFromSavings && !selectedSavingsType) {
      Alert.alert('Error', 'Please select a savings type');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        amount: parseFloat(amount),
        date: new Date(date)
      };

      if (isFromSavings && selectedSavingsType) {
        data.isFromSavings = true;
        data.savingsTypeId = selectedSavingsType._id;
      } else if (selectedType) {
        data.typeId = selectedType._id;
      }

      await axios.post(`${BACKEND_URL}/api/income-entries`, data, {
        headers: { Authorization: token }
      });

      Alert.alert('Success', 'Income entry added successfully!');
      onIncomeAdded?.();
      onClose();
    } catch (error: any) {
      console.error('Error adding income entry:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add income entry');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTotal = () => {
    if (isFromSavings && selectedSavingsType) {
      return selectedSavingsType.totalAmount;
    }
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

          <Text style={styles.title}>Add Income</Text>

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
            {/* Income Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Income Type</Text>
              
              {/* From Savings Button - Always shown first */}
              <View style={styles.savingsSection}>
                <TouchableOpacity
                  onPress={() => setIsFromSavings(!isFromSavings)}
                  style={[styles.savingsButton, isFromSavings && styles.savingsButtonActive]}
                >
                  <MaterialIcons name="account-balance-wallet" size={20} color={isFromSavings ? "#fff" : "#6b7280"} />
                  <Text style={[styles.savingsButtonText, isFromSavings && styles.savingsButtonTextActive]}>
                    From Savings
                  </Text>
                </TouchableOpacity>
                {isFromSavings && (
                  <Text style={styles.savingsWarningText}>
                    ⚠️ This money will be reduced from your savings
                  </Text>
                )}
              </View>

              {/* Regular Income Types */}
              {!showNewTypeInput ? (
                <View style={styles.incomeTypesSection}>
                  <View style={styles.incomeTypesHeader}>
                    <Text style={styles.incomeTypesLabel}>Regular Income Types:</Text>
                    <TouchableOpacity
                      onPress={() => setShowNewTypeInput(true)}
                      style={styles.addTypeButton}
                    >
                      <MaterialIcons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Horizontal Income Type Buttons */}
                  {incomeTypes.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalTypeList}
                      contentContainerStyle={styles.horizontalTypeListContent}
                    >
                      {incomeTypes.map((type) => (
                        <TouchableOpacity
                          key={type._id}
                          onPress={() => {
                            setSelectedType(type);
                            setIsFromSavings(false); // Unselect savings when regular type is selected
                          }}
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

            {/* Amount, Date, and Savings Options */}
            {(selectedType || isFromSavings) && (
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

                {/* Savings Type Selection - Only show when "From Savings" is selected */}
                {isFromSavings && (
                  <View style={styles.savingsSection}>
                    <Text style={styles.savingsLabel}>Select Savings Type:</Text>
                    <View style={[styles.savingsList, { maxHeight: dropdownMaxHeight }]}>
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                      >
                        {savingsTypes.map((savingsType) => (
                          <TouchableOpacity
                            key={savingsType._id}
                            onPress={() => setSelectedSavingsType(savingsType)}
                            style={[styles.savingsItem, selectedSavingsType?._id === savingsType._id && styles.selectedSavingsItem]}
                          >
                            <Text style={[styles.savingsItemText, selectedSavingsType?._id === savingsType._id && styles.selectedSavingsItemText]}>
                              {savingsType.name}
                            </Text>
                            <Text style={[styles.savingsItemAmount, selectedSavingsType?._id === savingsType._id && styles.selectedSavingsItemAmount]}>
                              ₹{(savingsType.totalAmount || 0).toFixed(2)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}

                {/* Current Total */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>
                    {isFromSavings ? 'Current Savings:' : 'Current Total:'}
                  </Text>
                  <Text style={styles.totalValue}>₹{(getCurrentTotal() || 0).toFixed(2)}</Text>
                </View>

                {/* New Total */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>
                    {isFromSavings ? 'New Savings:' : 'New Total:'}
                  </Text>
                  <Text style={styles.totalValue}>₹{(getNewTotal() || 0).toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !selectedType || !amount || (isFromSavings && !selectedSavingsType)}
              style={[
                styles.submitButton, 
                (loading || !selectedType || !amount || (isFromSavings && !selectedSavingsType)) && styles.submitButtonDisabled,
                keyboardVisible && { marginBottom: 40 } // Extra space when keyboard is open
              ]}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Income'}
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
  savingsToggleContainer: {
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  savingsList: {
    gap: 8,
  },
  savingsItem: {
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
  selectedSavingsItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  savingsItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedSavingsItemText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  savingsItemAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedSavingsItemAmount: {
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
    color: '#2563eb',
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
  // New styles for the updated UI
  savingsSection: {
    marginBottom: 20,
  },
  savingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  savingsButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  savingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  savingsButtonTextActive: {
    color: '#fff',
  },
  savingsWarningText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  incomeTypesSection: {
    marginBottom: 16,
  },
  incomeTypesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  incomeTypesLabel: {
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