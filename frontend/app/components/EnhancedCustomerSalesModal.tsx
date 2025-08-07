import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
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
  products: Product[];
  totalPrice: number;
  amountReceived: number;
  paymentMethod: string;
}

interface Customer {
  _id: string;
  name: string;
  credit: number;
  sales?: Sale[];
}

interface CustomerSalesModalProps {
  customer: Customer;
  onClose: () => void;
  onEditSale: (sale: Sale) => void;
  onRefresh?: () => void;
  token: string;
}

export default function EnhancedCustomerSalesModal({ customer, onClose, onEditSale, onRefresh, token }: CustomerSalesModalProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'addSale' | 'amountReceived'>('history');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Array<{ _id: string; name: string }>>([]);
  
  // Add Sale states
  const [selectedCustomerId, setSelectedCustomerId] = useState(customer._id);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    saleType: 'kg' | 'pack'; // Individual sale type for each product
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Amount Received states
  const [amountReceivedValue, setAmountReceivedValue] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmittingAmount, setIsSubmittingAmount] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
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
    const currentCredit = customer.credit;
    return currentCredit + totalPrice - received;
  };

  const handleSubmitSale = async () => {
    if (isSubmitting) return;
    
    if (!selectedCustomerId || selectedProducts.length === 0) {
      Alert.alert('Error', 'Please select a customer and add at least one product');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const saleData = {
        customerId: selectedCustomerId,
        products: selectedProducts.map(p => ({
          productName: p.productName,
          quantity: p.quantity,
          price: p.price,
          saleType: p.saleType
        })),
        totalPrice: getTotalPrice(),
        paymentMethod,
        amountReceived: parseFloat(amountReceived) || 0,
        date
      };

      await apiClient.post('/api/sales', saleData);
      Alert.alert('Success', 'Sale added successfully!');
      setActiveTab('history');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error adding sale:', error);
      setError(error.response?.data?.message || 'Failed to add sale');
      Alert.alert('Error', error.response?.data?.message || 'Failed to add sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAmountReceived = async () => {
    if (isSubmittingAmount) return;
    
    const amount = parseFloat(amountReceivedValue) || 0;
    const other = parseFloat(otherAmount) || 0;
    const totalAmount = amount + other;
    
    if (totalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (totalAmount > customer.credit) {
      Alert.alert('Error', 'Amount cannot exceed customer credit');
      return;
    }

    setIsSubmittingAmount(true);

    try {
      // Update customer credit
      await apiClient.put(`/api/customers/${customer._id}`, {
        credit: customer.credit - totalAmount
      });

      Alert.alert('Success', 'Amount received successfully!');
      setAmountReceivedValue('');
      setOtherAmount('');
      setDescription('');
      setActiveTab('history');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error updating amount received:', error);
      Alert.alert('Error', 'Failed to update amount received');
    } finally {
      setIsSubmittingAmount(false);
    }
  };

  if (!customer) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Floating Close Button */}
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { elevation: 3 }]}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>

        {/* Title & Refresh */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sales History</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={22} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.customerCredit}>Credit: ₹{customer.credit}</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'addSale' && styles.activeTab]}
            onPress={() => setActiveTab('addSale')}
          >
            <Text style={[styles.tabText, activeTab === 'addSale' && styles.activeTabText]}>Add Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'amountReceived' && styles.activeTab]}
            onPress={() => setActiveTab('amountReceived')}
          >
            <Text style={[styles.tabText, activeTab === 'amountReceived' && styles.activeTabText]}>Amount Received</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'history' && (
            <View>
              {customer.sales && customer.sales.length > 0 ? (
                (() => {
                  const sortedSales = [...customer.sales].sort((a: Sale, b: Sale) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateB - dateA;
                  });

                  const salesByDate = sortedSales.reduce((groups: { [key: string]: Sale[] }, sale: Sale) => {
                    const dateKey = new Date(sale.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(sale);
                    return groups;
                  }, {});

                  const sortedDateEntries = Object.entries(salesByDate)
                    .map(([dateKey, sales]) => ({
                      dateKey,
                      sales,
                      sortDate: new Date(sales[0].date).getTime()
                    }))
                    .sort((a, b) => b.sortDate - a.sortDate);

                  return sortedDateEntries.map(({ dateKey, sales }) => (
                    <View key={dateKey} style={styles.dateGroup}>
                      <Text style={styles.dateLabel}>{dateKey}</Text>
                      {sales.map((sale: Sale) => (
                        <View key={sale._id} style={styles.saleBox}>
                          <View style={styles.saleBoxHeader}>
                            <Text style={styles.saleTime}>
                              {new Date(sale.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                            {sale.saleType && (
                              <View style={styles.saleTypeBadge}>
                                <Text style={styles.saleTypeBadgeText}>{sale.saleType.toUpperCase()}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.productsList}>
                            {sale.products.map((product: Product) => (
                              <Text key={product._id} style={styles.productText}>
                                • {product.productName} <Text style={styles.productQty}>x{product.quantity}</Text> <Text style={styles.productPrice}>₹{product.price}</Text>
                              </Text>
                            ))}
                          </View>
                          <View style={styles.saleBoxFooter}>
                            <Text style={styles.saleTotal}>
                              <FontAwesome name="rupee" size={12} color="#64748b" /> {sale.totalPrice}  <Text style={styles.saleAmountReceived}>/ {sale.amountReceived}</Text>
                            </Text>
                            <View style={styles.paymentRow}>
                              <MaterialIcons name="payment" size={14} color="#64748b" />
                              <Text style={styles.paymentMethod}>{sale.paymentMethod}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => onEditSale(sale)}
                            style={styles.editButton}
                          >
                            <FontAwesome name="edit" size={14} color="#2563EB" />
                            <Text style={styles.editButtonText}>Edit</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ));
                })()
              ) : (
                <Text style={styles.noSalesText}>No sales history available.</Text>
              )}
            </View>
          )}

          {activeTab === 'addSale' && (
            <View style={styles.addSaleContent}>
              <Text style={styles.sectionTitle}>Add New Sale</Text>
              
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
                <Text style={styles.label}>Products</Text>
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
                      <MaterialIcons name="remove-circle" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity onPress={handleAddProduct} style={styles.addProductButton}>
                  <MaterialIcons name="add-circle" size={20} color="#2563eb" />
                  <Text style={styles.addProductButtonText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.paymentButtons}>
                  <TouchableOpacity
                    style={[styles.paymentButton, paymentMethod === 'cash' && styles.paymentButtonActive]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <Text style={[styles.paymentButtonText, paymentMethod === 'cash' && styles.paymentButtonTextActive]}>Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentButton, paymentMethod === 'online' && styles.paymentButtonActive]}
                    onPress={() => setPaymentMethod('online')}
                  >
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
                <Text style={styles.summaryText}>Total Price: ₹{getTotalPrice().toFixed(2)}</Text>
                <Text style={styles.summaryText}>Updated Credit: ₹{getUpdatedCredit().toFixed(2)}</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSubmitSale}
                disabled={isSubmitting}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Adding...' : 'Add Sale'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'amountReceived' && (
            <View style={styles.amountReceivedContent}>
              <Text style={styles.sectionTitle}>Amount Received</Text>
              
              <View style={styles.creditInfo}>
                <Text style={styles.creditLabel}>Current Credit:</Text>
                <Text style={styles.creditValue}>₹{customer.credit}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount Received</Text>
                <TextInput
                  style={styles.input}
                  value={amountReceivedValue}
                  onChangeText={setAmountReceivedValue}
                  placeholder="Enter amount received"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Other Amount</Text>
                <TextInput
                  style={styles.input}
                  value={otherAmount}
                  onChangeText={setOtherAmount}
                  placeholder="Enter other amount (optional)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description (optional)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  Total Amount: ₹{((parseFloat(amountReceivedValue) || 0) + (parseFloat(otherAmount) || 0)).toFixed(2)}
                </Text>
                <Text style={styles.summaryText}>
                  Remaining Credit: ₹{(customer.credit - ((parseFloat(amountReceivedValue) || 0) + (parseFloat(otherAmount) || 0))).toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSubmitAmountReceived}
                disabled={isSubmittingAmount}
                style={[styles.submitButton, isSubmittingAmount && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmittingAmount ? 'Updating...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  customerCredit: {
    fontSize: 16,
    color: '#6b7280',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    paddingTop: 10,
  },
  saleBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  saleBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  productsList: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  productQty: {
    color: '#6b7280',
  },
  productPrice: {
    fontWeight: '600',
    color: '#059669',
  },
  saleBoxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saleAmountReceived: {
    color: '#6b7280',
    fontWeight: 'normal',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 4,
  },
  noSalesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 40,
  },
  // Add Sale Styles
  addSaleContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
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
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  datePicker: {
    marginBottom: 0,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  saleTypeButtonTextActive: {
    color: '#ffffff',
  },
  removeButton: {
    padding: 4,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginLeft: 8,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  paymentButtonTextActive: {
    color: '#ffffff',
  },
  summaryContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
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
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Amount Received Styles
  amountReceivedContent: {
    paddingBottom: 20,
  },
  creditInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  creditValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
}); 