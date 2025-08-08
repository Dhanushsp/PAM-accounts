import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import DatePicker from './DatePicker';
import apiClient from '../../lib/axios-config';

interface Product {
  _id: string;
  productName: string;
  pricePerPack: number;
  kgsPerPack: number;
  pricePerKg: number;
}

interface Sale {
  _id: string;
  date: string;
  saleType?: string;
  products: Array<{
    _id: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  amountReceived: number;
  paymentMethod: string;
}

interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onSaleUpdated: () => void;
  token: string;
}

export default function EditSaleModal({ sale, onClose, onSaleUpdated, token }: EditSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [date, setDate] = useState(sale.date);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    saleType: 'kg' | 'pack';
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>(sale.paymentMethod as 'cash' | 'online');
  const [amountReceived, setAmountReceived] = useState(sale.amountReceived.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    fetchProducts();
    initializeSaleData();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const initializeSaleData = () => {
    // Convert sale products to the format expected by the form
    const formattedProducts = sale.products.map(product => {
      // Find the original product to get sale type
      const originalProduct = products.find(p => p.productName === product.productName);
      const saleType = originalProduct ? 
        (product.price === originalProduct.pricePerKg ? 'kg' : 'pack') : 'pack';
      
      return {
        productId: product._id,
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        saleType: saleType as 'kg' | 'pack'
      };
    });
    
    setSelectedProducts(formattedProducts);
  };

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, {
      productId: '',
      productName: '',
      quantity: 1,
      price: 0,
      saleType: 'pack'
    }]);
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    // Update product name when product is selected
    if (field === 'productId') {
      const product = products.find(p => p._id === value);
      if (product) {
        updatedProducts[index].productName = product.productName;
        // Set default price based on sale type
        updatedProducts[index].price = updatedProducts[index].saleType === 'kg' ? product.pricePerKg : product.pricePerPack;
      }
    }
    
    // Recalculate price when quantity or sale type changes
    if (field === 'quantity' || field === 'saleType') {
      const product = products.find(p => p._id === updatedProducts[index].productId);
      if (product) {
        const basePrice = field === 'saleType' && value === 'kg' ? product.pricePerKg : product.pricePerPack;
        updatedProducts[index].price = basePrice * updatedProducts[index].quantity;
      }
    }
    
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    return selectedProducts.reduce((total, product) => total + product.price, 0);
  };

  const getUpdatedCredit = () => {
    const totalPrice = getTotalPrice();
    const received = parseFloat(amountReceived) || 0;
    return totalPrice - received;
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    const totalPrice = getTotalPrice();
    const received = parseFloat(amountReceived) || 0;

    if (received > totalPrice) {
      Alert.alert('Error', 'Amount received cannot exceed total price');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const saleData = {
        date,
        saleType: 'mixed', // Since we have individual sale types per product
        products: selectedProducts.map(product => ({
          productId: product.productId,
          productName: product.productName,
          quantity: product.quantity,
          price: product.price,
          saleType: product.saleType
        })),
        totalPrice,
        amountReceived: received,
        paymentMethod
      };

      const response = await apiClient.put(`/api/sales/${sale._id}`, saleData);

      if (response.data.success) {
        Alert.alert('Success', 'Sale updated successfully!');
        onSaleUpdated();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating sale:', error);
      setError(error.response?.data?.message || 'Failed to update sale');
      Alert.alert('Error', error.response?.data?.message || 'Failed to update sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.overlay, { height: screenHeight }]}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.container,
          { height: screenHeight * 0.95, maxHeight: screenHeight * 0.95, minHeight: screenHeight * 0.85 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Sale</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

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

          {/* Products */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Products</Text>
              <TouchableOpacity onPress={handleAddProduct} style={styles.addButton}>
                <MaterialIcons name="add" size={20} color="#2563eb" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
            
            {selectedProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productSelect}>
                  <Text style={styles.subLabel}>Product</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      // Show product selection modal
                      Alert.alert('Select Product', 'Product selection will be implemented');
                    }}
                  >
                    <Text style={styles.pickerButtonText}>
                      {product.productName || 'Select Product'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.productDetails}>
                  <View style={styles.quantityRow}>
                    <Text style={styles.subLabel}>Quantity</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={product.quantity.toString()}
                      onChangeText={(text) => handleProductChange(index, 'quantity', parseInt(text) || 1)}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.saleTypeRow}>
                    <Text style={styles.subLabel}>Sale Type</Text>
                    <View style={styles.saleTypeButtons}>
                      <TouchableOpacity
                        style={[styles.saleTypeButton, product.saleType === 'pack' && styles.saleTypeButtonActive]}
                        onPress={() => handleProductChange(index, 'saleType', 'pack')}
                      >
                        <Text style={[styles.saleTypeButtonText, product.saleType === 'pack' && styles.saleTypeButtonTextActive]}>Pack</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saleTypeButton, product.saleType === 'kg' && styles.saleTypeButtonActive]}
                        onPress={() => handleProductChange(index, 'saleType', 'kg')}
                      >
                        <Text style={[styles.saleTypeButtonText, product.saleType === 'kg' && styles.saleTypeButtonTextActive]}>Kg</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleRemoveProduct(index)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="delete" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={[styles.paymentButton, paymentMethod === 'cash' && styles.paymentButtonActive]}
                onPress={() => setPaymentMethod('cash')}
              >
                <FontAwesome name="money" size={16} color={paymentMethod === 'cash' ? '#ffffff' : '#6b7280'} />
                <Text style={[styles.paymentButtonText, paymentMethod === 'cash' && styles.paymentButtonTextActive]}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentButton, paymentMethod === 'online' && styles.paymentButtonActive]}
                onPress={() => setPaymentMethod('online')}
              >
                <MaterialIcons name="credit-card" size={16} color={paymentMethod === 'online' ? '#ffffff' : '#6b7280'} />
                <Text style={[styles.paymentButtonText, paymentMethod === 'online' && styles.paymentButtonTextActive]}>Online</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Received */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Received</Text>
            <TextInput
              style={styles.input}
              value={amountReceived}
              onChangeText={setAmountReceived}
              placeholder="Enter amount received"
              keyboardType="numeric"
            />
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Price:</Text>
              <Text style={styles.summaryValue}>₹{getTotalPrice()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Received:</Text>
              <Text style={styles.summaryValue}>₹{parseFloat(amountReceived) || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining Credit:</Text>
              <Text style={[styles.summaryValue, getUpdatedCredit() > 0 && styles.creditValue]}>
                ₹{getUpdatedCredit()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialIcons name="update" size={20} color="#ffffff" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Updating...' : 'Update Sale'}
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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '95%',
    maxWidth: 560,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 4,
  },
  productRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productSelect: {
    marginBottom: 10,
  },
  pickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityRow: {
    flex: 1,
    marginRight: 10,
  },
  quantityInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  saleTypeRow: {
    flex: 1,
    marginRight: 10,
  },
  saleTypeButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  saleTypeButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  saleTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  saleTypeButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  saleTypeButtonTextActive: {
    color: '#ffffff',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 10,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  paymentButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paymentButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  paymentButtonTextActive: {
    color: '#ffffff',
  },
  summaryContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  creditValue: {
    color: '#dc2626',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
