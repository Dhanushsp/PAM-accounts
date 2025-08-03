import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DatePicker from '../DatePicker';
import apiClient from '../../../lib/axios-config';

interface EditIncomeEntryProps {
  entry: IncomeEntry;
  incomeTypes: IncomeType[];
  token: string;
  onClose: () => void;
  onEntryUpdated: () => void;
}

interface IncomeEntry {
  _id: string;
  date: string;
  amount: number;
  typeId: string;
  isFromSavings?: boolean;
}

interface IncomeType {
  _id: string;
  name: string;
  totalAmount: number;
  entries: IncomeEntry[];
}

export default function EditIncomeEntry({ entry, incomeTypes, token, onClose, onEntryUpdated }: EditIncomeEntryProps) {
  const [date, setDate] = useState(entry.date);
  const [amount, setAmount] = useState(entry.amount.toString());
  const [selectedTypeId, setSelectedTypeId] = useState(entry.typeId);
  const [isFromSavings, setIsFromSavings] = useState(entry.isFromSavings || false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = incomeTypes.find(type => type._id === selectedTypeId);

  const handleSubmit = async () => {
    if (!amount || !selectedTypeId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const entryData = {
        date,
        amount: amountValue,
        typeId: selectedTypeId,
        isFromSavings,
      };

      await apiClient.put(`/api/income-entries/${entry._id}`, entryData);
      
      Alert.alert('Success', 'Income entry updated successfully');
      onEntryUpdated();
    } catch (error: any) {
      console.error('Error updating income entry:', error);
      setError(error.response?.data?.message || 'Failed to update income entry');
      Alert.alert('Error', error.response?.data?.message || 'Failed to update income entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Income Entry</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <DatePicker
                value={new Date(date)}
                onDateChange={(selectedDate) => setDate(selectedDate ? selectedDate.toISOString().split('T')[0] : date)}
                placeholder="Select Date"
                style={styles.datePicker}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Income Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Income Type *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTypeModal(true)}
              >
                <Text style={[styles.pickerButtonText, !selectedType && styles.placeholderText]}>
                  {selectedType ? selectedType.name : 'Select income type'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* From Savings Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>From Savings</Text>
                <Switch
                  value={isFromSavings}
                  onValueChange={setIsFromSavings}
                  trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                  thumbColor={isFromSavings ? '#ffffff' : '#f3f4f6'}
                />
              </View>
              <Text style={styles.switchDescription}>
                Toggle if this income is from savings withdrawal
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Updating...' : 'Update Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Type Selection Modal */}
        <Modal visible={showTypeModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowTypeModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Income Type</Text>
              <ScrollView style={styles.modalScroll}>
                {incomeTypes.map((type) => (
                  <TouchableOpacity
                    key={type._id}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedTypeId(type._id);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  datePicker: {
    marginBottom: 0,
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
  placeholderText: {
    color: '#9ca3af',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
}); 