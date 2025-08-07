import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import apiClient from '../../lib/axios-config';
import AddProductPopup from '../components/AddProductPopup';
import DeleteAuthPopup from '../components/DeleteAuthPopup';
import PriceUpdatePopup from '../components/PriceUpdatePopup';
import PriceHistoryDisplay from '../components/PriceHistoryDisplay';
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddProductPopup, setShowAddProductPopup] = useState(false);
  const [showDeleteAuthPopup, setShowDeleteAuthPopup] = useState(false);
  const [showPriceUpdatePopup, setShowPriceUpdatePopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToUpdatePrice, setProductToUpdatePrice] = useState<Product | null>(null);
  const insets = useSafeAreaInsets();

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
    if (!editingProduct || isUpdating) return;

    setIsUpdating(true);
    try {
      await apiClient.put(
        `/api/products/${editingProduct._id}`,
        editForm
      );
      Alert.alert('Success', 'Product updated successfully');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriceUpdate = (product: Product) => {
    setProductToUpdatePrice(product);
    setShowPriceUpdatePopup(true);
  };

  const handlePriceUpdated = () => {
    fetchProducts();
  };

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

  if (editingProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => setEditingProduct(null)}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Product</Text>
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
              onChangeText={(text) => setEditForm(prev => ({ ...prev, pricePerKg: text }))}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={isUpdating}
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
            >
              <Text style={styles.updateButtonText}>
                {isUpdating ? 'Updating...' : 'Update Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={22} color="#2563EB" />
          </Pressable>
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity
            onPress={handleDownloadProducts}
            style={styles.downloadButton}
          >
            <MaterialIcons name="download" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Product List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {products.map((product) => (
              <View
                key={product._id}
                style={styles.productCard}
              >
                <View style={styles.productCardContent}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {product.productName}
                    </Text>
                    <View style={styles.productDetails}>
                      <Text style={styles.productDetailText}>Price per Pack: ₹{product.pricePerPack}</Text>
                      <Text style={styles.productDetailText}>Kgs per Pack: {product.kgsPerPack} kg</Text>
                      <Text style={styles.productDetailText}>Price per Kg: ₹{product.pricePerKg}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => handleEdit(product)}
                      style={styles.editButton}
                    >
                      <MaterialIcons name="edit" size={18} color="#2563EB" />
                    </Pressable>
                    <Pressable
                      onPress={() => handlePriceUpdate(product)}
                      style={styles.updatePriceButton}
                    >
                      <MaterialIcons name="attach-money" size={18} color="#2563EB" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(product)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
                                 <PriceHistoryDisplay productId={product._id} productName={product.productName} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add Product Popup */}
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

             {/* Price Update Popup */}
       {showPriceUpdatePopup && productToUpdatePrice && (
         <PriceUpdatePopup
           product={productToUpdatePrice}
           token={token}
           onClose={() => {
             setShowPriceUpdatePopup(false);
             setProductToUpdatePrice(null);
           }}
           onPriceUpdated={handlePriceUpdated}
         />
       )}

      {/* Add Button */}
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
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
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
  updatePriceButton: {
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