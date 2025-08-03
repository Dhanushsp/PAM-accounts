import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, Modal, StyleSheet, Platform, ActivityIndicator, Image, ScrollView, Alert, Keyboard, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DatePicker from './DatePicker';
import apiClient from '../../lib/axios-config';

interface EditExpenseProps {
  expense: Expense;
  token: string;
  onClose: () => void;
  onExpenseUpdated: () => void;
}

interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  photo?: string;
}

interface Category {
  _id: string;
  name: string;
  subcategories: string[];
}

export default function EditExpense({ expense, token, onClose, onExpenseUpdated }: EditExpenseProps) {
  const [date, setDate] = useState(expense.date);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [subcategory, setSubcategory] = useState(expense.subcategory);
  const [description, setDescription] = useState(expense.description);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategorySelectModal, setShowCategorySelectModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [photo, setPhoto] = useState<string | null>(expense.photo || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(expense.photo || null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard detection
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;

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
  const availableHeight = screenHeight - keyboardHeight - 40;
  const containerMaxHeight = keyboardVisible 
    ? Math.min(screenHeight * 0.8, availableHeight)
    : screenHeight * 0.95;

  // Cloudinary config
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/drqxzr8uw/image/upload';
  const CLOUDINARY_UPLOAD_PRESET = 'pam_expenses';

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get(`/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle photo selection and upload
  const handlePhotoSelection = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setPhotoUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'expense_photo.jpg',
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
        Alert.alert('Success', 'Photo uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category || !subcategory) {
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
      const expenseData = {
        date,
        amount: amountValue,
        category,
        subcategory,
        description,
        photo: photoUrl,
      };

      await apiClient.put(`/api/expenses/${expense._id}`, expenseData);
      
      Alert.alert('Success', 'Expense updated successfully');
      onExpenseUpdated();
    } catch (error: any) {
      console.error('Error updating expense:', error);
      setError(error.response?.data?.message || 'Failed to update expense');
      Alert.alert('Error', error.response?.data?.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryData = categories.find(cat => cat.name === category);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { maxHeight: containerMaxHeight }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Expense</Text>
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

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategorySelectModal(true)}
              >
                <Text style={[styles.pickerButtonText, !category && styles.placeholderText]}>
                  {category || 'Select category'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Subcategory */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subcategory *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, !category && styles.disabledButton]}
                onPress={() => category && setShowSubcategoryModal(true)}
                disabled={!category}
              >
                <Text style={[styles.pickerButtonText, (!subcategory || !category) && styles.placeholderText]}>
                  {subcategory || 'Select subcategory'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo (Optional)</Text>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoSelection}
                disabled={photoUploading}
              >
                {photoUploading ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : photo ? (
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={32} color="#6b7280" />
                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
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
              {isSubmitting ? 'Updating...' : 'Update Expense'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection Modal */}
        <Modal visible={showCategorySelectModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowCategorySelectModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <ScrollView style={styles.modalScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.modalOption}
                    onPress={() => {
                      setCategory(cat.name);
                      setSubcategory(''); // Reset subcategory when category changes
                      setShowCategorySelectModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Subcategory Selection Modal */}
        <Modal visible={showSubcategoryModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowSubcategoryModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Subcategory</Text>
              <ScrollView style={styles.modalScroll}>
                {availableSubcategories.map((subcat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOption}
                    onPress={() => {
                      setSubcategory(subcat);
                      setShowSubcategoryModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{subcat}</Text>
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
  textArea: {
    minHeight: 80,
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
  disabledButton: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  photoButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
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