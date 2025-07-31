import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import apiClient from '../../lib/axios-config';
import AddProductPopup from '../components/AddProductPopup';
import DeleteAuthPopup from '../components/DeleteAuthPopup';
import { useSync } from '../lib/useSync';
import { getPendingActions, saveData, KEYS } from '../lib/storage';
import NetInfo from '@react-native-community/netinfo';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


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
  const [showAddProductPopup, setShowAddProductPopup] = useState(false);
  const [showDeleteAuthPopup, setShowDeleteAuthPopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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

  useEffect(() => {
    if (!showAddProductPopup) {
      fetchProducts();
    }
  }, [showAddProductPopup]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/products`);
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
    setProductToDelete(product);
    setShowDeleteAuthPopup(true);
  };

  const handleDeleteConfirm = async (mobile: string, password: string) => {
    if (!productToDelete) return;

    try {
      await apiClient.delete(`/api/products/${productToDelete._id}`, {
        headers: { Authorization: token },
        data: { mobile, password }
      });
      Alert.alert('Success', 'Product deleted successfully');
      setShowDeleteAuthPopup(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Invalid credentials. Deletion denied.');
      } else {
        Alert.alert('Error', 'Failed to delete product');
      }
      setShowDeleteAuthPopup(false);
      setProductToDelete(null);
    }
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

  // SYNC LOGIC
  const syncProducts = async () => {
    // Get pending actions
    const pending = await getPendingActions();
    // Only process product actions
    const productActions = pending.filter(a => a.type && a.entity === 'product');
    for (const action of productActions) {
      if (action.op === 'add') {
        await apiClient.post(`/api/addproducts`, action.data, {
          headers: { 'Content-Type': 'application/json', Authorization: token }
        });
      } else if (action.op === 'edit') {
        await apiClient.put(`/api/products/${action.id}`, action.data, {
          headers: { 'Content-Type': 'application/json', Authorization: token }
        });
      } else if (action.op === 'delete') {
        await apiClient.delete(`/api/products/${action.id}`);
      }
    }
    // After syncing, refresh products and cache
    await fetchProducts();
    await saveData(KEYS.products, products);
  };

  const { isOnline, isSyncing, lastSync, hasPending, handleSync } = useSync(syncProducts);

  const handleDownloadProducts = async () => {
    if (!products.length) return;
    const data = products.map(p => ({
      Name: p.productName,
      'Price per Pack': p.pricePerPack,
      'Kgs per Pack': p.kgsPerPack,
      'Price per Kg': p.pricePerKg,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'products.xlsx';
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Download Products' });
  };

  if (editingProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Modernized Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => setEditingProduct(null)}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
            </Pressable>
            <Text style={styles.headerTitle}>
              Edit Product
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Edit Form */}
          <View style={styles.editForm}>
            <TextInput
              placeholder="Product Name"
              value={editForm.productName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, productName: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Price per Pack"
              value={editForm.pricePerPack}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, pricePerPack: text }))}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Kgs per Pack"
              value={editForm.kgsPerPack}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, kgsPerPack: text }))}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Price per Kg"
              value={editForm.pricePerKg}
              editable={false}
              style={styles.disabledInput}
            />
            <TouchableOpacity
              onPress={handleUpdate}
              style={styles.updateButton}
            >
              <Text style={styles.updateButtonText}>Update Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
          <TouchableOpacity
            onPress={handleDownloadProducts}
            className="bg-gray-100 rounded-full p-2"
            style={{ elevation: 2 }}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
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
      {showAddProductPopup && (
        <AddProductPopup
          token={token}
          onClose={() => setShowAddProductPopup(false)}
          onProductAdded={() => {
            setShowAddProductPopup(false);
            fetchProducts();
          }}
        />
      )}

      {/* Delete Authentication Popup */}
      {showDeleteAuthPopup && productToDelete && (
        <DeleteAuthPopup
          onClose={() => {
            setShowDeleteAuthPopup(false);
            setProductToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete.productName}"? Please enter your credentials to confirm.`}
        />
      )}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 12, alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2563eb',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.10,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => setShowAddProductPopup(true)}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF', // equivalent to bg-blue-50
  },
  content: {
    flex: 1,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  downloadButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  // Edit Form Styles
  editForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    fontSize: 16,
  },
  disabledInput: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: 16,
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  // Product List Styles
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 18,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 18,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  productDetails: {
    gap: 4,
  },
  productDetailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 8,
    elevation: 1,
  },
}); 