import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable, FlatList } from 'react-native';
import axios from 'axios';
// Import packages for dropdown/multi-select
import RNPickerSelect from 'react-native-picker-select';
// You can use any multi-select lib, here I'll show conceptually:
import MultiSelect from 'react-native-multiple-select';


export default function AddSale({ onClose, onSaleAdded, onSetSortToRecent, token }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [saleType, setSaleType] = useState('kg');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [updatedCredit, setUpdatedCredit] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const getProductPrice = (product, type) => {
    if (type === 'kg') return product.pricePerKg;
    return product.pricePerPack;
  };

  useEffect(() => {
    if (token) {
      axios.get(`${BACKEND_URL}/api/customers`, { 
        headers: { Authorization: token } 
      })
        .then(res => setCustomers(res.data))
        .catch(err => console.error('Error fetching customers:', err));
      
      axios.get(`${BACKEND_URL}/api/products`, { 
        headers: { Authorization: token } 
      })
        .then(res => setProducts(res.data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [token]);

  useEffect(() => {
    setProductDetails(prev =>
      prev.map(item => {
        const product = products.find(p => p._id === item.productId);
        return product ? { ...item, price: getProductPrice(product, saleType) } : item;
      })
    );
  }, [saleType]);

  const handleProductChange = selected => {
    setSelectedProducts(selected);
    const details = selected.map(id => {
      const product = products.find(p => p._id === id);
      return {
        productId: id,
        productName: product.productName,
        quantity: 0,
        price: getProductPrice(product, saleType)
      };
    });
    setProductDetails(details);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...productDetails];
    updated[index].quantity = parseFloat(value) || 0;
    setProductDetails(updated);
  };

  const handlePriceChange = (index, value) => {
    const updated = [...productDetails];
    updated[index].price = parseFloat(value) || 0;
    setProductDetails(updated);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return setError('Please select a customer');
    if (!productDetails.length) return setError('Please select at least one product');
    if (!token) return setError('Authentication token is missing');
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
      await axios.post(`${BACKEND_URL}/api/sales`, data, { 
        headers: { Authorization: token } 
      });
      alert('Sale added successfully!');
      onClose();
      onSetSortToRecent?.();
      setTimeout(() => onSaleAdded?.(), 100);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const total = productDetails.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    setTotalPrice(total);
  }, [productDetails]);

  useEffect(() => {
    const filtered = customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase()));
    setFilteredCustomers(filtered);
  }, [customerName, customers]);

  useEffect(() => {
    if (selectedCustomer) {
      setUpdatedCredit(parseFloat(selectedCustomer.credit) + (totalPrice - (amountReceived || 0)));
    } else {
      setUpdatedCredit(totalPrice - amountReceived);
    }
  }, [selectedCustomer, totalPrice, amountReceived]);

  return (
    <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
      <ScrollView className="bg-white w-11/12 max-w-lg rounded-2xl p-4 space-y-4 max-h-[90vh]">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-blue-700">Add Sale</Text>
          <Pressable onPress={onClose}><Text className="text-gray-400 text-2xl font-bold">&times;</Text></Pressable>
        </View>

        <TextInput
          placeholder="Search Customer"
          value={customerName}
          onChangeText={setCustomerName}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />

        {filteredCustomers.length > 0 && (
          <View className="bg-white border rounded-lg max-h-40">
            <ScrollView>
              {filteredCustomers.map(c => (
                <Pressable
                  key={c._id}
                  onPress={() => { setSelectedCustomer(c); setCustomerName(c.name); setCurrentCredit(c.credit); }}
                  className="px-3 py-2 hover:bg-blue-50"
                >
                  <Text>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedCustomer && (
          <>
            <Text className="text-sm text-gray-600">Current Credit: ₹{currentCredit.toFixed(2)}</Text>
            <Text className="text-sm">Sale Date</Text>
            <TextInput
              value={saleDate}
              onChangeText={setSaleDate}
              placeholder="YYYY-MM-DD"
              className="border border-gray-300 rounded-lg px-3 py-2"
            />

            <Text className="text-sm">Sale Type</Text>
            <RNPickerSelect
              value={saleType}
              onValueChange={setSaleType}
              items={[{ label: 'KG', value: 'kg' }, { label: 'Pack', value: 'pack' }]}
              style={{ inputAndroid: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 } }}
            />

            <Text className="text-sm">Products</Text>
            <MultiSelect
              items={products.map(p => ({ id: p._id, name: p.productName }))}
              uniqueKey="id"
              onSelectedItemsChange={handleProductChange}
              selectedItems={selectedProducts}
              selectText="Pick Products"
              searchInputPlaceholderText="Search Products..."
            />

            {productDetails.map((item, idx) => (
              <View key={item.productId} className="bg-gray-50 rounded-lg p-2 space-y-2">
                <Text className="font-medium">{item.productName}</Text>
                <TextInput
                  value={item.quantity.toString()}
                  onChangeText={v => handleQuantityChange(idx, v)}
                  placeholder="Quantity"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <TextInput
                  value={item.price.toString()}
                  onChangeText={v => handlePriceChange(idx, v)}
                  placeholder="Price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>
            ))}

            <Text className="font-semibold">Total Price: ₹{totalPrice.toFixed(2)}</Text>

            <Text className="text-sm">Payment Method</Text>
            <RNPickerSelect
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              items={[
                { label: 'Cash', value: 'cash' },
                { label: 'Online Payment', value: 'online' },
                { label: 'Credit', value: 'credit' }
              ]}
              style={{ inputAndroid: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 } }}
            />

            <TextInput
              value={amountReceived.toString()}
              onChangeText={v => setAmountReceived(parseFloat(v) || 0)}
              placeholder="Amount Received"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-3 py-2"
            />

            <Text className="text-sm text-gray-600">Updated Credit: ₹{updatedCredit.toFixed(2)}</Text>
            {error ? <Text className="text-red-500 text-center">{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 py-2 rounded-lg active:scale-95"
            >
              <Text className="text-white text-center">{isSubmitting ? 'Adding Sale...' : 'Add Sale'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
