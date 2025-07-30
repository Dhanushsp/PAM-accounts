import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import DatePicker from './DatePicker';

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

interface AddSaleProps {
  onClose: () => void;
  onSaleAdded?: () => void;
  onSetSortToRecent?: () => void;
  token: string;
}

export default function AddSale({ onClose, onSaleAdded, onSetSortToRecent, token }: AddSaleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [saleType, setSaleType] = useState<'kg' | 'pack'>('kg');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [updatedCredit, setUpdatedCredit] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    if (token) {
      axios.get(`${BACKEND_URL}/api/customers`, { headers: { Authorization: token } })
        .then(res => setCustomers(res.data))
        .catch(err => console.error('Error fetching customers:', err));

      axios.get(`${BACKEND_URL}/api/products`, { headers: { Authorization: token } })
        .then(res => setProducts(res.data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [token]);

  useEffect(() => {
    setProductDetails(prev =>
      prev.map(item => {
        const product = products.find(p => p._id === item.productId);
        return product ? { ...item, price: saleType === 'kg' ? product.pricePerKg : product.pricePerPack } : item;
      })
    );
  }, [saleType, products]);

  useEffect(() => {
    setFilteredCustomers(customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())));
  }, [customerName, customers]);

  useEffect(() => {
    const total = productDetails.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    setTotalPrice(total);
  }, [productDetails]);

  useEffect(() => {
    setUpdatedCredit(selectedCustomer ? parseFloat(selectedCustomer.credit as any) + (totalPrice - amountReceived) : totalPrice - amountReceived);
  }, [selectedCustomer, totalPrice, amountReceived]);

  const handleProductChange = (selected: string[]) => {
    setSelectedProducts(selected);
    const details = selected.map(id => {
      const product = products.find(p => p._id === id);
      if (!product) return null;
      return {
        productId: id,
        productName: product.productName,
        quantity: 0,
        price: saleType === 'kg' ? product.pricePerKg : product.pricePerPack
      };
    }).filter(Boolean) as ProductDetail[];
    setProductDetails(details);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCurrentCredit(customer.credit);
    // Dismiss keyboard when customer is selected
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return setError('Please select a customer');
    if (!productDetails.length) return setError('Please select at least one product');
    if (!token) return setError('Authentication token missing');
    setIsSubmitting(true); setError('');
    try {
      const data = {
        customerId: selectedCustomer._id,
        saleType,
        products: productDetails,
        totalPrice,
        paymentMethod,
        amountReceived,
        updatedCredit,
        date: new Date(saleDate)
      };
      await axios.post(`${BACKEND_URL}/api/sales`, data, { headers: { Authorization: token } });
      Alert.alert('Success', 'Sale added successfully!');
      onClose();
      onSetSortToRecent?.();
      setTimeout(() => onSaleAdded?.(), 100);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic heights based on keyboard state
  const availableHeight = screenHeight - keyboardHeight - 40; // Reduced margin for better space usage
  const containerMaxHeight = keyboardVisible 
    ? Math.min(screenHeight * 0.8, availableHeight) // Increased height to 80% of screen
    : screenHeight * 0.95;
  const scrollViewHeight = keyboardVisible 
    ? availableHeight - 120 // Adjusted for better content visibility
    : '80%';
  const dropdownMaxHeight = keyboardVisible ? 120 : 160;

  return (
    <View style={styles.overlay}>
      <View style={[
        styles.keyboardAvoidingTop,
        keyboardVisible && {
          justifyContent: 'flex-end', // When keyboard is open, align to bottom of available space
          paddingBottom: 20, // Add some padding from keyboard
        }
      ]}>
        <View style={[
          styles.container, 
          { maxHeight: containerMaxHeight }, 
          styles.containerTop,
          keyboardVisible && {
            marginBottom: 0, // Remove any bottom margin when keyboard is open
          }
        ]}>
        {/* Close button */}
          <Pressable onPress={onClose} style={[styles.closeButton, { elevation: 3 }]}>
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>

        <Text style={styles.title}>Add Sale</Text>

          <ScrollView
            style={[styles.scrollView, { height: scrollViewHeight }]}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
          <TextInput
            placeholder="Search Customer"
            value={customerName}
            onChangeText={setCustomerName}
            style={styles.input}
            placeholderTextColor="#888"
          />

            {/* Only show customer dropdown when typing and no customer selected */}
            {customerName && !selectedCustomer && filteredCustomers.length > 0 && (
              <View style={[styles.customerList, { maxHeight: dropdownMaxHeight }]}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                {filteredCustomers.map(c => (
                  <Pressable
                    key={c._id}
                      onPress={() => handleCustomerSelect(c)}
                    style={styles.customerListItem}
                  >
                    <Text>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedCustomer && (
            <>
              <Text style={styles.creditText}>Current Credit: ₹{currentCredit.toFixed(2)}</Text>

              <DatePicker
                value={new Date(saleDate)}
                onDateChange={(date) => setSaleDate(date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
                placeholder="Select Date"
                style={styles.input}
              />

              {/* Sale type */}
              <View style={styles.rowGap2}>
                {['kg', 'pack'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => setSaleType(type as 'kg' | 'pack')}
                    style={[styles.saleTypeButton, saleType === type ? styles.saleTypeButtonActive : styles.saleTypeButtonInactive]}
                  >
                    <Text style={saleType === type ? styles.saleTypeTextActive : styles.saleTypeTextInactive}>
                      {type.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Products */}
              <Text style={styles.productsLabel}>Products</Text>
                <View style={[styles.productsList, { maxHeight: dropdownMaxHeight }]}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                  {products.map(product => (
                    <Pressable
                      key={product._id}
                      onPress={() => {
                        setSelectedProducts(prev =>
                          prev.includes(product._id)
                            ? prev.filter(id => id !== product._id)
                            : [...prev, product._id]
                        );
                          handleProductChange(selectedProducts.includes(product._id)
                            ? selectedProducts.filter(id => id !== product._id)
                            : [...selectedProducts, product._id]);
                      }}
                      style={[styles.productItem, selectedProducts.includes(product._id) && styles.productItemActive]}
                    >
                      <Text style={selectedProducts.includes(product._id) ? styles.productItemTextActive : styles.productItemTextInactive}>
                        {product.productName}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {productDetails.map((item, idx) => (
                <View key={item.productId} style={styles.productDetailBox}>
                  <Text style={styles.productDetailTitle}>{item.productName}</Text>
                  <View style={styles.rowGap2}>
                    <TextInput
                      value={item.quantity.toString()}
                      onChangeText={v => {
                        const updated = [...productDetails];
                        updated[idx].quantity = parseFloat(v) || 0;
                        setProductDetails(updated);
                      }}
                      placeholder="Quantity"
                      keyboardType="numeric"
                      style={styles.productDetailInput}
                      placeholderTextColor="#888"
                    />
                    <TextInput
                      value={item.price.toString()}
                      onChangeText={v => {
                        const updated = [...productDetails];
                        updated[idx].price = parseFloat(v) || 0;
                        setProductDetails(updated);
                      }}
                      placeholder="Price"
                      keyboardType="numeric"
                      style={styles.productDetailInput}
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
              ))}

              <Text style={styles.totalPriceText}>Total Price: ₹{totalPrice.toFixed(2)}</Text>

              <TextInput
                value={amountReceived.toString()}
                onChangeText={v => setAmountReceived(parseFloat(v) || 0)}
                placeholder="Amount Received"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#888"
              />

              <Text style={styles.updatedCreditText}>Updated Credit: ₹{updatedCredit.toFixed(2)}</Text>

              {/* Payment method */}
              <View style={styles.rowGap2Mb4}>
                {['cash', 'online'].map(method => (
                  <Pressable
                    key={method}
                    onPress={() => setPaymentMethod(method as 'cash' | 'online')}
                    style={[styles.paymentButton, paymentMethod === method ? styles.paymentButtonActive : styles.paymentButtonInactive]}
                  >
                    <Text style={paymentMethod === method ? styles.paymentTextActive : styles.paymentTextInactive}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  customerList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    marginBottom: 16,
  },
  customerListItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  creditText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  rowGap2: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  saleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
  },
  saleTypeButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
  },
  saleTypeButtonInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  saleTypeTextActive: {
    fontWeight: '600',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  saleTypeTextInactive: {
    color: '#374151',
    textAlign: 'center',
  },
  productsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  productsList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  productItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  productItemActive: {
    backgroundColor: '#dbeafe',
  },
  productItemTextActive: {
    fontWeight: '600',
    color: '#1d4ed8',
  },
  productItemTextInactive: {
    color: '#374151',
  },
  productDetailBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  productDetailTitle: {
    fontWeight: '500',
    marginBottom: 8,
    color: '#1d4ed8',
  },
  productDetailInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#000',
    fontSize: 16,
    marginRight: 8,
  },
  totalPriceText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  updatedCreditText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  rowGap2Mb4: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  paymentButtonActive: {
    backgroundColor: '#bbf7d0',
    borderColor: '#4ade80',
  },
  paymentButtonInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  paymentTextActive: {
    fontWeight: '600',
    color: '#15803d',
  },
  paymentTextInactive: {
    color: '#374151',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20, // Add bottom margin for gap from screen bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
