import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

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

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

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
      alert('Sale added successfully!');
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

  return (
    <View
      className="absolute inset-0 z-50 justify-center items-center bg-black/40"
      style={{ flex: 1 }}
    >
      <View className="bg-white w-11/12 max-w-xl rounded-3xl shadow-lg overflow-hidden max-h-[95vh]">
        {/* Close button */}
        <Pressable
          onPress={onClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 rounded-full p-2"
          style={{ elevation: 3 }}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>

        <Text className="text-lg font-bold text-blue-700 text-center pt-7 pb-2">Add Sale</Text>

        <ScrollView className="px-6 pb-6 pt-2" style={{ maxHeight: '80vh' }} contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            placeholder="Search Customer"
            value={customerName}
            onChangeText={setCustomerName}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />

          {filteredCustomers.length > 0 && (
            <View className="bg-white border border-gray-200 rounded-xl max-h-40 mb-4">
              <ScrollView>
                {filteredCustomers.map(c => (
                  <Pressable
                    key={c._id}
                    onPress={() => { setSelectedCustomer(c); setCustomerName(c.name); setCurrentCredit(c.credit); }}
                    className="px-4 py-2 rounded-xl"
                  >
                    <Text>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedCustomer && (
            <>
              <Text className="text-sm text-gray-600 mb-2">Current Credit: ₹{currentCredit.toFixed(2)}</Text>

              <TextInput
                value={saleDate}
                onChangeText={setSaleDate}
                placeholder="YYYY-MM-DD"
                className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                placeholderTextColor="#888"
              />

              {/* Sale type */}
              <View className="flex-row mb-4 gap-2">
                {['kg', 'pack'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => setSaleType(type as 'kg' | 'pack')}
                    className={`px-4 py-2 rounded-full border ${saleType === type ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-200'}`}
                  >
                    <Text className={saleType === type ? 'font-semibold text-blue-700' : 'text-gray-700'}>
                      {type.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Products */}
              <Text className="text-sm mb-1">Products</Text>
              <View className="border border-gray-200 rounded-xl max-h-40 mb-4 bg-gray-50">
                <ScrollView>
                  {products.map(product => (
                    <Pressable
                      key={product._id}
                      onPress={() => {
                        setSelectedProducts(prev =>
                          prev.includes(product._id)
                            ? prev.filter(id => id !== product._id)
                            : [...prev, product._id]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl mb-1 ${selectedProducts.includes(product._id) ? 'bg-blue-100' : ''}`}
                    >
                      <Text className={selectedProducts.includes(product._id) ? 'font-semibold text-blue-700' : 'text-gray-700'}>
                        {product.productName}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {productDetails.map((item, idx) => (
                <View key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-3 mb-3 shadow-sm">
                  <Text className="font-medium mb-2 text-blue-700">{item.productName}</Text>
                  <View className="flex-row gap-2 mb-2">
                    <TextInput
                      value={item.quantity.toString()}
                      onChangeText={v => {
                        const updated = [...productDetails];
                        updated[idx].quantity = parseFloat(v) || 0;
                        setProductDetails(updated);
                      }}
                      placeholder="Quantity"
                      keyboardType="numeric"
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
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
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
              ))}

              <Text className="font-semibold text-lg text-center mb-2">Total Price: ₹{totalPrice.toFixed(2)}</Text>

              <TextInput
                value={amountReceived.toString()}
                onChangeText={v => setAmountReceived(parseFloat(v) || 0)}
                placeholder="Amount Received"
                keyboardType="numeric"
                className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                placeholderTextColor="#888"
              />

              <Text className="text-sm text-gray-600 mb-2 text-center">Updated Credit: ₹{updatedCredit.toFixed(2)}</Text>

              {/* Payment method */}
              <View className="flex-row gap-2 mb-4">
                {['cash', 'online'].map(method => (
                  <Pressable
                    key={method}
                    onPress={() => setPaymentMethod(method as 'cash' | 'online')}
                    className={`flex-1 px-4 py-2 rounded-full border ${paymentMethod === method ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-200'}`}
                  >
                    <Text className={paymentMethod === method ? 'font-semibold text-green-700' : 'text-gray-700'}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {error ? <Text className="text-red-500 mb-2 text-center">{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 py-3 rounded-xl mt-2 active:scale-95 shadow-sm"
              >
                <Text className="text-white text-center font-semibold text-base">
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
