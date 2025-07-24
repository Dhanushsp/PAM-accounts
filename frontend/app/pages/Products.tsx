import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';


interface Product {
  _id: string;
  productName: string;
  pricePerPack: number;
  kgsPerPack: number;
  pricePerKg: number;
}

interface ProductsProps {
  onBack: () => void;
  token: string;
}

export default function Products({ onBack, token }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    productName: '',
    pricePerPack: '',
    kgsPerPack: '',
    pricePerKg: ''
  });
  const insets = useSafeAreaInsets();

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (editingProduct) {
        setEditingProduct(null);
        return true;
      }
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [editingProduct, onBack]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: token }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      productName: product.productName,
      pricePerPack: product.pricePerPack.toString(),
      kgsPerPack: product.kgsPerPack.toString(),
      pricePerKg: product.pricePerKg.toString()
    });
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/products/${editingProduct._id}`,
        editForm,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token 
          }
        }
      );
      
      Alert.alert('Success', 'Product updated successfully');
      setEditingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/products/${product._id}`, {
                headers: { Authorization: token }
              });
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts(); // Refresh the list
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const calculatePricePerKg = () => {
    const { pricePerPack, kgsPerPack } = editForm;
    if (pricePerPack && kgsPerPack && !isNaN(Number(pricePerPack)) && !isNaN(Number(kgsPerPack))) {
      const perKg = Number(pricePerPack) / Number(kgsPerPack);
      setEditForm(prev => ({ ...prev, pricePerKg: perKg.toFixed(2) }));
    }
  };

  useEffect(() => {
    calculatePricePerKg();
  }, [editForm.pricePerPack, editForm.kgsPerPack]);

  if (editingProduct) {
    return (
      <SafeAreaView className="flex-1 bg-blue-50">
        <View className="flex-1 p-4">
          {/* Modernized Header */}
          <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1" style={{ elevation: 3 }}>
            <Pressable
              onPress={() => setEditingProduct(null)}
              className="bg-gray-100 rounded-full p-2"
              style={{ elevation: 2 }}
            >
              <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
            </Pressable>
            <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center" style={{ letterSpacing: 1 }}>
              Edit Product
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Edit Form */}
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <TextInput
              placeholder="Product Name"
              value={editForm.productName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, productName: text }))}
              className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TextInput
              placeholder="Price per Pack"
              value={editForm.pricePerPack}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, pricePerPack: text }))}
              keyboardType="numeric"
              className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TextInput
              placeholder="Kgs per Pack"
              value={editForm.kgsPerPack}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, kgsPerPack: text }))}
              keyboardType="numeric"
              className="w-full mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-base"
            />
            <TextInput
              placeholder="Price per Kg"
              value={editForm.pricePerKg}
              editable={false}
              className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-500 text-base"
            />
            <TouchableOpacity
              onPress={handleUpdate}
              className="w-full bg-blue-600 py-3 rounded-xl shadow-sm"
            >
              <Text className="text-white text-center font-semibold text-lg">Update Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-4">
        {/* Modernized Header */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-md px-4 py-3 mb-6 mt-1" style={{ elevation: 3 }}>
          <Pressable
            onPress={onBack}
            className="bg-gray-100 rounded-full p-2"
            style={{ elevation: 2 }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </Pressable>
          <Text className="text-xl font-extrabold text-blue-700 flex-1 text-center" style={{ letterSpacing: 1 }}>
            Products
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Products List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">No products found</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {products.map((product) => (
              <View
                key={product._id}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800 mb-2">
                      {product.productName}
                    </Text>
                    <View className="space-y-1">
                      <Text className="text-sm text-gray-600">
                        Price per Pack: ₹{product.pricePerPack}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Kgs per Pack: {product.kgsPerPack} kg
                      </Text>
                      <Text className="text-sm text-gray-600">
                        Price per Kg: ₹{product.pricePerKg}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2 ml-2">
                    <Pressable
                      onPress={() => handleEdit(product)}
                      className="bg-blue-100 rounded-full p-2"
                      style={{ elevation: 1 }}
                    >
                      <MaterialIcons name="edit" size={18} color="#2563EB" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(product)}
                      className="bg-red-100 rounded-full p-2"
                      style={{ elevation: 1 }}
                    >
                      <MaterialIcons name="delete" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
} 