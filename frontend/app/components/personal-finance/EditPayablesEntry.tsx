import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DatePicker from '../DatePicker';
import apiClient from '../../../lib/axios-config';

interface PayableType {
  _id: string;
  name: string;
}

interface PayableEntry {
  _id: string;
  date: string;
  amount: number;
  typeId: string;
}

interface EditPayablesEntryProps {
  entry: PayableEntry;
  onClose: () => void;
  onUpdated: () => void;
  token: string;
}

export default function EditPayablesEntry({ entry, onClose, onUpdated, token }: EditPayablesEntryProps) {
  const [payableTypes, setPayableTypes] = useState<PayableType[]>([]);
  const [formData, setFormData] = useState({
    date: new Date(entry.date).toISOString().split('T')[0],
    amount: entry.amount.toString(),
    typeId: entry.typeId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayableTypes();
  }, []);

  const fetchPayableTypes = async () => {
    try {
      const response = await apiClient.get('/api/payable-types');
      setPayableTypes(response.data);
    } catch (error) {
      console.error('Error fetching payable types:', error);
      Alert.alert('Error', 'Failed to fetch payable types');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.date || !formData.amount || !formData.typeId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.put(`/api/payable-entries/${entry._id}`, {
        date: formData.date,
        amount: amount,
        typeId: formData.typeId
      });

      Alert.alert('Success', 'Payable entry updated successfully!');
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating payable entry:', error);
      setError(error.response?.data?.message || 'Failed to update payable entry');
      Alert.alert('Error', error.response?.data?.message || 'Failed to update payable entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = payableTypes.find(type => type._id === formData.typeId);

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Payable Entry</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <DatePicker
                value={new Date(formData.date)}
                onDateChange={(selectedDate) => setFormData({
                  ...formData,
                  date: selectedDate ? selectedDate.toISOString().split('T')[0] : formData.date
                })}
                placeholder="Select Date"
                style={styles.datePicker}
              />
            </View>

            {/* Payable Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payable Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  // Show type selection modal
                  Alert.alert('Select Type', 'Type selection will be implemented');
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedType?.name || 'Select Payable Type'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Updating...' : 'Update Entry'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  datePicker: {
    marginBottom: 0,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 