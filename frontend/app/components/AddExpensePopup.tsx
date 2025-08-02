import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, Modal, StyleSheet, Platform, ActivityIndicator, Image, ScrollView, Alert, Keyboard, Dimensions } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import DatePicker from './DatePicker';import apiClient from '../../lib/axios-config';


interface AddExpensePopupProps {
  token: string;
  onClose: () => void;
}

interface Category {
  _id: string;
  name: string;
  subcategories: string[];
}

// Empty initial categories - will be loaded from database
const INITIAL_CATEGORIES: Category[] = [];

export default function AddExpensePopup({ token, onClose }: AddExpensePopupProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingSubIdx, setEditingSubIdx] = useState<{catIdx: number, subIdx: number} | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [showCategorySelectModal, setShowCategorySelectModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get(`/api/categories`);
      setCategories(response.data);
      
      // Set default category and subcategory if available
      if (response.data.length > 0 && !category) {
        setCategory(response.data[0].name);
        if (response.data[0].subcategories.length > 0) {
          setSubcategory(response.data[0].subcategories[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
  const CLOUDINARY_UPLOAD_PRESET = 'pam_expenses'; // You must create this unsigned preset in your Cloudinary dashboard

  // Handle photo selection and upload
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUploading(true);
      setError('');
      try {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: 'expense.jpg',
          type: 'image/jpeg',
        } as any);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          setPhotoUrl(data.secure_url);
        } else {
          setError('Failed to upload image.');
        }
      } catch (err) {
        setError('Failed to upload image.');
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  // Handle category add/edit
  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        const response = await apiClient.post(`/api/categories`, {
          name: newCategory.trim(),
          subcategories: []
        });
        
        setCategories([...categories, response.data.category]);
        setNewCategory('');
        Alert.alert('Success', 'Category added successfully!');
      } catch (error: any) {
        console.error('Error adding category:', error);
        Alert.alert('Error', error.response?.data?.error || 'Failed to add category');
      }
    }
  };
  const handleAddSubcategory = async () => {
    if (newSubcategory.trim() && category) {
      try {
        const selectedCategory = categories.find(cat => cat.name === category);
        if (!selectedCategory) return;

        const response = await apiClient.post(`/api/categories/${selectedCategory._id}/subcategories`, {
          subcategory: newSubcategory.trim()
        });
        
        setCategories(categories.map(cat =>
          cat._id === selectedCategory._id
            ? response.data.category
            : cat
        ));
        setNewSubcategory('');
        Alert.alert('Success', 'Subcategory added successfully!');
      } catch (error: any) {
        console.error('Error adding subcategory:', error);
        Alert.alert('Error', error.response?.data?.error || 'Failed to add subcategory');
      }
    }
  };

  // Edit category name
  const handleEditCategory = (idx: number) => {
    setEditingCategoryIdx(idx);
    setEditCategoryName(categories[idx].name);
  };
  const handleSaveEditCategory = async (idx: number) => {
    if (editCategoryName.trim()) {
      try {
        const categoryToEdit = categories[idx];
        const response = await apiClient.put(`/api/categories/${categoryToEdit._id}`, {
          name: editCategoryName.trim(),
          subcategories: categoryToEdit.subcategories
        });
        
        setCategories(categories.map((cat, i) => i === idx ? response.data.category : cat));
        setEditCategoryName('');
        setEditingCategoryIdx(null);
        Alert.alert('Success', 'Category updated successfully!');
      } catch (error: any) {
        console.error('Error updating category:', error);
        Alert.alert('Error', error.response?.data?.error || 'Failed to update category');
      }
    }
  };
  const handleDeleteCategory = async (idx: number) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category and all its subcategories?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const categoryToDelete = categories[idx];
          await apiClient.delete(`/api/categories/${categoryToDelete._id}`);
          
          setCategories(categories.filter((_, i) => i !== idx));
          if (categories[idx].name === category) setCategory(categories[0]?.name || '');
          Alert.alert('Success', 'Category deleted successfully!');
        } catch (error: any) {
          console.error('Error deleting category:', error);
          Alert.alert('Error', error.response?.data?.error || 'Failed to delete category');
        }
      }}
    ]);
  };
  // Edit subcategory name
  const handleEditSubcategory = (catIdx: number, subIdx: number) => {
    setEditingSubIdx({catIdx, subIdx});
    setEditSubcategoryName(categories[catIdx].subcategories[subIdx]);
  };
  const handleSaveEditSubcategory = (catIdx: number, subIdx: number) => {
    if (editSubcategoryName.trim()) {
      setCategories(categories.map((cat, i) =>
        i === catIdx
          ? { ...cat, subcategories: cat.subcategories.map((sub, j) => j === subIdx ? editSubcategoryName.trim() : sub) }
          : cat
      ));
      setEditingSubIdx(null);
      setEditSubcategoryName('');
    }
  };
  const handleDeleteSubcategory = (catIdx: number, subIdx: number) => {
    Alert.alert('Delete Subcategory', 'Are you sure you want to delete this subcategory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setCategories(categories.map((cat, i) =>
          i === catIdx
            ? { ...cat, subcategories: cat.subcategories.filter((_, j) => j !== subIdx) }
            : cat
        ));
        if (categories[catIdx].subcategories[subIdx] === subcategory) setSubcategory(categories[catIdx].subcategories[0] || '');
      }}
    ]);
  };

  // Handle expense submit
  const handleSubmit = async () => {
    if (!amount || !category || !subcategory) {
      setError('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/expenses`, {
        date,
        amount: parseFloat(amount),
        category,
        subcategory,
        description,
        photo: photoUrl,
      });
      Alert.alert('Success', 'Expense added successfully!');
      onClose();
    } catch (err: any) {
      setError('Failed to add expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update subcategory when category changes
  React.useEffect(() => {
    const cat = categories.find(c => c.name === category);
    if (cat && cat.subcategories.length > 0) {
      setSubcategory(cat.subcategories[0]);
    } else {
      setSubcategory('');
    }
  }, [category, categories]);

  const cat = categories.find(c => c.name === category);

  return (
    <View style={styles.overlay}>
      <View style={[
        styles.keyboardAvoidingTop,
        keyboardVisible && {
          justifyContent: 'flex-end',
          paddingBottom: 20,
        }
      ]}>
        <View style={[
          styles.container, 
          { maxHeight: containerMaxHeight }, 
          styles.containerTop,
          keyboardVisible && {
            marginBottom: 0,
          }
        ]}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color="#64748b" />
          </Pressable>

          <Text style={styles.title}>Add Expense</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Date */}
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
                              // Date picker will be handled by DatePicker component
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#888"
            />

            {/* Amount */}
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              keyboardType="numeric"
              placeholderTextColor="#888"
            />

            {/* Category & Subcategory */}
            <View style={styles.rowAlignCenter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.dropdownRow}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowCategorySelectModal(true)}
                  >
                    <Text style={styles.dropdownText}>{category}</Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                  </TouchableOpacity>
                  <Pressable onPress={() => setShowCategoryModal(true)} style={styles.pencilIcon}>
                    <MaterialIcons name="edit" size={20} color="#64748b" />
                  </Pressable>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Subcategory</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowSubcategoryModal(true)}
                  disabled={!cat || !cat.subcategories.length}
                >
                  <Text style={styles.dropdownText}>{subcategory || 'Select'}</Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              placeholderTextColor="#888"
            />

            {/* Photo */}
            <View style={styles.photoRow}>
              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity onPress={handlePickPhoto} style={styles.photoButton}>
                <FontAwesome5 name="camera" size={18} color="#2563eb" />
              </TouchableOpacity>
              {photoUploading && <ActivityIndicator size="small" color="#2563eb" style={{ marginLeft: 8 }} />}
              {photoUrl && (
                <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
              )}
            </View>

            {/* Error */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Add Expense'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Categories</Text>
            <TextInput
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="New Category"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
              <Text style={styles.addButtonText}>Add Category</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={newSubcategory}
              onChangeText={setNewSubcategory}
              placeholder="New Subcategory"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddSubcategory}>
              <Text style={styles.addButtonText}>Add Subcategory</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 120, marginTop: 8 }}>
              {categories.map((cat, idx) => (
                <View key={cat.name + idx} style={{ marginBottom: 8 }}>
                  {editingCategoryIdx === idx ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={editCategoryName}
                        onChangeText={setEditCategoryName}
                        autoFocus
                      />
                      <TouchableOpacity onPress={() => handleSaveEditCategory(idx)} style={{ marginLeft: 4 }}>
                        <MaterialIcons name="check" size={20} color="#2563eb" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingCategoryIdx(null)} style={{ marginLeft: 4 }}>
                        <MaterialIcons name="close" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCategory(idx)} style={{ marginLeft: 4 }}>
                        <MaterialIcons name="delete" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => setCategory(cat.name)} style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: cat.name === category ? '#2563eb' : '#222' }}>{cat.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEditCategory(idx)} style={{ marginLeft: 4 }}>
                        <MaterialIcons name="edit" size={18} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {cat.subcategories.map((sub, subIdx) => (
                    editingSubIdx && editingSubIdx.catIdx === idx && editingSubIdx.subIdx === subIdx ? (
                      <View key={sub + subIdx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          value={editSubcategoryName}
                          onChangeText={setEditSubcategoryName}
                          autoFocus
                        />
                        <TouchableOpacity onPress={() => handleSaveEditSubcategory(idx, subIdx)} style={{ marginLeft: 4 }}>
                          <MaterialIcons name="check" size={18} color="#2563eb" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingSubIdx(null)} style={{ marginLeft: 4 }}>
                          <MaterialIcons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteSubcategory(idx, subIdx)} style={{ marginLeft: 4 }}>
                          <MaterialIcons name="delete" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View key={sub + subIdx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <Text style={{ color: sub === subcategory ? '#2563eb' : '#444', flex: 1 }}>{sub}</Text>
                        <TouchableOpacity onPress={() => handleEditSubcategory(idx, subIdx)} style={{ marginLeft: 4 }}>
                          <MaterialIcons name="edit" size={16} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                    )
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.closeModalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Category Select Modal */}
      <Modal
        visible={showCategorySelectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategorySelectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {categories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat.name + idx}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategorySelectModal(false);
                  }}
                >
                  <Text style={{ color: cat.name === category ? '#2563eb' : '#222', fontWeight: cat.name === category ? 'bold' : 'normal' }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowCategorySelectModal(false)}>
              <Text style={styles.closeModalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Subcategory Select Modal */}
      <Modal
        visible={showSubcategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubcategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subcategory</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {cat && cat.subcategories.length > 0 ? (
                cat.subcategories.map((sub, idx) => (
                  <TouchableOpacity
                    key={sub + idx}
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => {
                      setSubcategory(sub);
                      setShowSubcategoryModal(false);
                    }}
                  >
                    <Text style={{ color: sub === subcategory ? '#2563eb' : '#222', fontWeight: sub === subcategory ? 'bold' : 'normal' }}>{sub}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No subcategories available.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowSubcategoryModal(false)}>
              <Text style={styles.closeModalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    zIndex: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoidingTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    paddingTop: 20,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    marginTop: 0,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
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
  rowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdown: {
    flex: 1,
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
  },
  pencilIcon: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  photoButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
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
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 12,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  closeModalButton: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 