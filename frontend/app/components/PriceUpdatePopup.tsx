import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../lib/axios-config';

interface Product {
  _id: string;
  productName: string;
  pricePerPack: number;
  kgsPerPack: number;
  pricePerKg: number;
}

interface PriceUpdatePopupProps {
  product: Product;
  token: string;
  onClose: () => void;
  onPriceUpdated: () => void;
}

export default function PriceUpdatePopup({
  product,
  token,
  onClose,
  onPriceUpdated
}: PriceUpdatePopupProps) {
  const [newPricePerPack, setNewPricePerPack] = useState(product.pricePerPack.toString());
  const [newPricePerKg, setNewPricePerKg] = useState(product.pricePerKg.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePrice = async () => {
    if (!newPricePerPack || !newPricePerKg) {
      Alert.alert('Error', 'Please fill in all price fields');
      return;
    }

    const newPackPrice = parseFloat(newPricePerPack);
    const newKgPrice = parseFloat(newPricePerKg);

    if (isNaN(newPackPrice) || isNaN(newKgPrice)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (newPackPrice === product.pricePerPack && newKgPrice === product.pricePerKg) {
      Alert.alert('Error', 'No price change detected');
      return;
    }

    Alert.alert(
      'Update Price',
      `Are you sure you want to update the price?\n\nOld Price per Pack: ₹${product.pricePerPack}\nNew Price per Pack: ₹${newPackPrice}\n\nOld Price per Kg: ₹${product.pricePerKg}\nNew Price per Kg: ₹${newKgPrice}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.post('/api/price-history/update-price', {
                productId: product._id,
                newPricePerPack: newPackPrice,
                newPricePerKg: newKgPrice,
                reason: reason || 'Price update'
              });
              
              Alert.alert('Success', 'Product price updated successfully');
              onPriceUpdated();
              onClose();
            } catch (error: any) {
              console.error('Error updating price:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to update price');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Update Price</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.productName}</Text>
              <Text style={styles.currentPrice}>
                Current Price per Pack: ₹{product.pricePerPack}
              </Text>
              <Text style={styles.currentPrice}>
                Current Price per Kg: ₹{product.pricePerKg}
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>New Prices</Text>
              
              <TextInput
                placeholder="New Price per Pack"
                value={newPricePerPack}
                onChangeText={setNewPricePerPack}
                keyboardType="numeric"
                style={styles.input}
              />
              
              <TextInput
                placeholder="New Price per Kg"
                value={newPricePerKg}
                onChangeText={setNewPricePerKg}
                keyboardType="numeric"
                style={styles.input}
              />
              
              <TextInput
                placeholder="Reason for price change (optional)"
                value={reason}
                onChangeText={setReason}
                style={styles.input}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdatePrice}
              style={[styles.updateButton, loading && styles.updateButtonDisabled]}
              disabled={loading}
            >
              <Text style={styles.updateButtonText}>
                {loading ? 'Updating...' : 'Update Price'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  updateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 