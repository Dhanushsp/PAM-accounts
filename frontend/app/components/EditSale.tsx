import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DatePicker from './DatePicker';
import apiClient from '../../lib/axios-config';

interface Customer {
  _id: string;
  name: string;
  credit: number;
}

interface Product {
  _id: string;
  productName: string;
  pricePerKg: number;
  pricePerPack: number;
}

interface ProductDetail {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Sale {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    contact: string;
  };
  saleType: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  paymentMethod: string;
  amountReceived: number;
  date: string;
}

interface EditSaleProps {
  sale: Sale;
  onClose: () => void;
  onSaleUpdated: () => void;
  token: string;
}

export default function EditSale({ sale, onClose, onSaleUpdated, token }: EditSaleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [saleType, setSaleType] = useState<'pack' | 'kg'>(sale.saleType as 'pack' | 'kg' || 'pack');
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [totalPrice, setTotalPrice] = useState(sale.totalPrice);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>(sale.paymentMethod as 'cash' | 'online' || 'cash');
  const [amountReceived, setAmountReceived] = useState(sale.amountReceived);
  const [updatedCredit, setUpdatedCredit] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date(sale.date).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    if (token) {
      apiClient.get(`/api/customers`)
        .then(res => {
          setCustomers(res.data);
          // Set the customer from the sale
          const customer = res.data.find((c: Customer) => c._id === sale.customerId._id);
          if (customer) {
            setSelectedCustomer(customer);
            setCurrentCredit(customer.credit);
          }
        })
        .catch(err => console.error('Error fetching customers:', err));

      apiClient.get(`/api/products`)
        .then(res => setProducts(res.data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [token, sale.customerId._id]);

  // Initialize product details from sale
  useEffect(() => {
    if (sale.products && sale.products.length > 0) {
      const details = sale.products.map(product => ({
        productId: '', // We'll need to find the product ID
        productName: product.productName,
        quantity: product.quantity,
        price: product.price
      }));
      setProductDetails(details);
    }
  }, [sale.products]);

  useEffect(() => {
    setUpdatedCredit(selectedCustomer ? parseFloat(selectedCustomer.credit as any) + (totalPrice - amountReceived) : totalPrice - amountReceived);
  }, [selectedCustomer, totalPrice, amountReceived]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentCredit(customer.credit);
  };

  const handleProductChange = (index: number, field: keyof ProductDetail, value: string | number) => {
    const updatedDetails = [...productDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    
    // Recalculate price based on sale type
    const product = products.find(p => p._id === updatedDetails[index].productId);
    if (product) {
      const price = saleType === 'kg' ? product.pricePerKg : product.pricePerPack;
      updatedDetails[index].price = price;
    }
    
    setProductDetails(updatedDetails);
    
    // Recalculate total
    const newTotal = updatedDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);
    setTotalPrice(newTotal);
  };

  const addProduct = () => {
    setProductDetails([...productDetails, {
      productId: '',
      productName: '',
      quantity: 1,
      price: 0
    }]);
  };

  const removeProduct = (index: number) => {
    const updatedDetails = productDetails.filter((_, i) => i !== index);
    setProductDetails(updatedDetails);
    
    // Recalculate total
    const newTotal = updatedDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);
    setTotalPrice(newTotal);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (productDetails.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    if (amountReceived > totalPrice) {
      Alert.alert('Error', 'Amount received cannot be greater than total price');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const saleData = {
        customerId: selectedCustomer._id,
        saleType,
        products: productDetails.map(detail => ({
          productName: detail.productName,
          quantity: detail.quantity,
          price: detail.price
        })),
        totalPrice,
        paymentMethod,
        amountReceived,
        date: saleDate,
        updatedCredit
      };

      await apiClient.put(`/api/sales/${sale._id}`, saleData);
      
      Alert.alert('Success', 'Sale updated successfully');
      onSaleUpdated();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      setError(error.response?.data?.message || 'Failed to update sale');
      Alert.alert('Error', error.response?.data?.message || 'Failed to update sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Sale</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  onPress={() => handleCustomerSelect(customer)}
                  style={[
                    styles.customerButton,
                    selectedCustomer?._id === customer._id && styles.customerButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.customerButtonText,
                    selectedCustomer?._id === customer._id && styles.customerButtonTextSelected
                  ]}>
                    {customer.name}
                  </Text>
                  <Text style={[
                    styles.customerCreditText,
                    selectedCustomer?._id === customer._id && styles.customerCreditTextSelected
                  ]}>
                    ₹{customer.credit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedCustomer && (
              <Text style={styles.currentCreditText}>
                Current Credit: ₹{currentCredit}
              </Text>
            )}
          </View>

          {/* Sale Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sale Type</Text>
            <View style={styles.saleTypeContainer}>
              <TouchableOpacity
                onPress={() => setSaleType('pack')}
                style={[styles.saleTypeButton, saleType === 'pack' && styles.saleTypeButtonSelected]}
              >
                <Text style={[styles.saleTypeText, saleType === 'pack' && styles.saleTypeTextSelected]}>Pack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSaleType('kg')}
                style={[styles.saleTypeButton, saleType === 'kg' && styles.saleTypeButtonSelected]}
              >
                <Text style={[styles.saleTypeText, saleType === 'kg' && styles.saleTypeTextSelected]}>KG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
              <TouchableOpacity onPress={addProduct} style={styles.addButton}>
                <MaterialIcons name="add" size={20} color="#2563eb" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
            
            {productDetails.map((detail, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productHeader}>
                  <Text style={styles.productNumber}>Product {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeProduct(index)} style={styles.removeButton}>
                    <MaterialIcons name="remove-circle" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  placeholder="Product Name"
                  value={detail.productName}
                  onChangeText={(text) => handleProductChange(index, 'productName', text)}
                  style={styles.input}
                />
                
                <View style={styles.quantityPriceRow}>
                  <TextInput
                    placeholder="Quantity"
                    value={detail.quantity.toString()}
                    onChangeText={(text) => handleProductChange(index, 'quantity', parseInt(text) || 0)}
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput]}
                  />
                  <TextInput
                    placeholder="Price"
                    value={detail.price.toString()}
                    onChangeText={(text) => handleProductChange(index, 'price', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                onPress={() => setPaymentMethod('cash')}
                style={[styles.paymentMethodButton, paymentMethod === 'cash' && styles.paymentMethodButtonSelected]}
              >
                <Text style={[styles.paymentMethodText, paymentMethod === 'cash' && styles.paymentMethodTextSelected]}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentMethod('online')}
                style={[styles.paymentMethodButton, paymentMethod === 'online' && styles.paymentMethodButtonSelected]}
              >
                <Text style={[styles.paymentMethodText, paymentMethod === 'online' && styles.paymentMethodTextSelected]}>Online</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Amount Received"
              value={amountReceived.toString()}
              onChangeText={(text) => setAmountReceived(parseFloat(text) || 0)}
              keyboardType="numeric"
              style={styles.input}
            />

            <DatePicker
              value={new Date(saleDate)}
              onDateChange={(date) => setSaleDate(date ? date.toISOString().split('T')[0] : saleDate)}
              placeholder="Sale Date"
              style={styles.datePicker}
            />
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Price:</Text>
              <Text style={styles.summaryValue}>₹{totalPrice}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Received:</Text>
              <Text style={styles.summaryValue}>₹{amountReceived}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Credit After Sale:</Text>
              <Text style={[styles.summaryValue, { color: updatedCredit > 0 ? '#dc2626' : '#059669' }]}>
                ₹{updatedCredit}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Updating...' : 'Update Sale'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  customerScroll: {
    marginBottom: 8,
  },
  customerButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customerButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  customerButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  customerButtonTextSelected: {
    color: '#ffffff',
  },
  customerCreditText: {
    fontSize: 12,
    color: '#6b7280',
  },
  customerCreditTextSelected: {
    color: '#dbeafe',
  },
  currentCreditText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  saleTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  saleTypeButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  saleTypeButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  saleTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  saleTypeTextSelected: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  addButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 4,
  },
  productItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  removeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  quantityPriceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  paymentMethodTextSelected: {
    color: '#ffffff',
  },
  datePicker: {
    marginBottom: 8,
  },
  summarySection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
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
}); 