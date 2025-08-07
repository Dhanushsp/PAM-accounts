import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import DatePicker from '../components/DatePicker';
import EditSale from '../components/EditSale';
import DeleteAuthPopup from '../components/DeleteAuthPopup';
import apiClient from '../../lib/axios-config';

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

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalAmountReceived: number;
  salesByType: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
  salesByPaymentMethod: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
}

interface SalesResponse {
  sales: Sale[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSales: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SalesProps {
  token: string;
  onBack: () => void;
}

export default function Sales({ token, onBack }: SalesProps) {
  // Add error state
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  
  // Filter states
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterSaleType, setFilterSaleType] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [customers, setCustomers] = useState<Array<{ _id: string; name: string }>>([]);
  
  // Edit states
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Delete states
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    let isMounted = true;
    
    if (token) {
      const loadData = async () => {
        try {
          if (isMounted) {
            await fetchCustomers();
            await fetchSales();
            await fetchSummary();
          }
        } catch (error) {
          console.error('Error loading sales data:', error);
        }
      };
      
      loadData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSales();
    }
  }, [token, currentPage, filterFromDate, filterToDate, filterSaleType, filterPaymentMethod, filterCustomerId, filterCustomerName]);

  useEffect(() => {
    if (token) {
      fetchSummary();
    }
  }, [token, filterFromDate, filterToDate]);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get(`/api/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (filterFromDate) params.append('fromDate', filterFromDate);
      if (filterToDate) params.append('toDate', filterToDate);
      if (filterSaleType) params.append('saleType', filterSaleType);
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);
      if (filterCustomerId) params.append('customerId', filterCustomerId);
      if (filterCustomerName) params.append('customerName', filterCustomerName);

      const response = await apiClient.get<SalesResponse>(`/api/sales?${params}`);

      setSales(response.data.sales);
      setTotalPages(response.data.pagination.totalPages);
      setTotalSales(response.data.pagination.totalSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to fetch sales data');
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterFromDate) params.append('fromDate', filterFromDate);
      if (filterToDate) params.append('toDate', filterToDate);

      const response = await apiClient.get<SalesSummary>(`/api/sales/summary?${params}`);

      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      setError('Failed to fetch sales summary');
      // Don't show alert for summary errors as they're not critical
    } finally {
      setSummaryLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterFromDate('');
    setFilterToDate('');
    setFilterSaleType('');
    setFilterPaymentMethod('');
    setFilterCustomerId('');
    setFilterCustomerName('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getSelectedCustomerName = () => {
    if (!filterCustomerId) return 'All Customers';
    const customer = customers.find(c => c._id === filterCustomerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getCashTotal = () => {
    if (!summary?.salesByPaymentMethod) return 0;
    const cashMethods = ['cash', 'cash payment', 'cash_payment'];
    return summary.salesByPaymentMethod
      .filter(s => cashMethods.includes(s._id?.toLowerCase()))
      .reduce((total, s) => total + (s.total || 0), 0);
  };

  const getOnlineTotal = () => {
    if (!summary?.salesByPaymentMethod) return 0;
    const onlineMethods = ['online', 'online payment', 'online_payment', 'upi', 'card'];
    return summary.salesByPaymentMethod
      .filter(s => onlineMethods.includes(s._id?.toLowerCase()))
      .reduce((total, s) => total + (s.total || 0), 0);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowEditModal(true);
  };

  const handleSaleUpdated = () => {
    fetchSales();
    fetchSummary();
    setShowEditModal(false);
    setEditingSale(null);
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeletingSale(sale);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSale) return;
    
    try {
      await apiClient.delete(`/api/sales/${deletingSale._id}`);
      Alert.alert('Success', 'Sale deleted successfully!');
      fetchSales();
      fetchSummary();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete sale');
    } finally {
      setShowDeleteModal(false);
      setDeletingSale(null);
    }
  };

  // Safety check for token
  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color="#dc2626" />
            <Text style={styles.errorText}>Authentication required</Text>
            <TouchableOpacity
              onPress={onBack}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  try {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales Management</Text>
          <View style={styles.headerSpacer} />
        </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <DatePicker
            value={filterFromDate ? new Date(filterFromDate) : null}
            onDateChange={(date) => setFilterFromDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="From Date"
            style={{ flex: 1, marginRight: 8 }}
          />
          <DatePicker
            value={filterToDate ? new Date(filterToDate) : null}
            onDateChange={(date) => setFilterToDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="To Date"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
        
        {/* Customer Name Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer name..."
              value={filterCustomerName}
              onChangeText={setFilterCustomerName}
              placeholderTextColor="#9CA3AF"
            />
            {filterCustomerName.length > 0 && (
              <TouchableOpacity
                onPress={() => setFilterCustomerName('')}
                style={styles.clearSearchButton}
              >
                <MaterialIcons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Clear Filters Button */}
        {(filterFromDate || filterToDate || filterCustomerName) && (
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearFiltersButton}
          >
            <MaterialIcons name="clear" size={16} color="#DC2626" />
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
        {/* <View style={styles.filterRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="Sale Type (kg/pack)"
            value={filterSaleType}
            onChangeText={setFilterSaleType}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Payment Method (cash/online)"
            value={filterPaymentMethod}
            onChangeText={setFilterPaymentMethod}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.customerFilterText}>
            Customer: {getSelectedCustomerName()}
          </Text>
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Summary Cards */}
      {summary && !summaryLoading && (
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.cashCard]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="money" size={16} color="#059669" />
              <Text style={styles.summaryLabel}>Cash Total</Text>
            </View>
            <Text style={styles.summaryValue}>
              ₹{getCashTotal().toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.onlineCard]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="credit-card" size={16} color="#2563eb" />
              <Text style={styles.summaryLabel}>Online Total</Text>
            </View>
            <Text style={styles.summaryValue}>
              ₹{getOnlineTotal().toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.totalCard]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="account-balance-wallet" size={16} color="#7c3aed" />
              <Text style={styles.summaryLabel}>All Total</Text>
            </View>
            <Text style={styles.summaryValue}>
              ₹{(summary.totalRevenue || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
      
      {summaryLoading && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.summaryLabel}>Loading...</Text>
          </View>
          <View style={styles.summaryCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.summaryLabel}>Loading...</Text>
          </View>
          <View style={styles.summaryCard}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.summaryLabel}>Loading...</Text>
          </View>
        </View>
      )}

      {/* Sales List */}
       <ScrollView style={styles.salesList} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                fetchSales();
                fetchSummary();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading sales...</Text>
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No sales found</Text>
          </View>
        ) : (
          <>
            {sales.map((sale) => (
              <View key={sale._id || Math.random().toString()} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleDate}>{sale.date ? formatDate(sale.date) : 'No Date'}</Text>
                  <View style={styles.saleTypeBadge}>
                    <Text style={styles.saleTypeText}>{sale.saleType?.toUpperCase() || 'N/A'}</Text>
                  </View>
                </View>
                
                <Text style={styles.customerName}>{sale.customerId?.name || 'Unknown Customer'}</Text>
                
                <View style={styles.productsContainer}>
                  {(sale.products || []).map((product, index) => (
                    <Text key={index} style={styles.productText}>
                      • {product.productName || 'Unknown Product'} x{product.quantity || 0} @ ₹{product.price || 0}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.saleFooter}>
                  <View style={styles.paymentInfo}>
                    <MaterialIcons name="attach-money" size={14} color="#64748b" />
                    <Text style={styles.amountReceived}>₹{sale.amountReceived || 0}</Text>
                  </View>
                  <View style={styles.saleActions}>
                    <View style={styles.paymentMethod}>
                      <MaterialIcons name="payment" size={16} color="#64748b" />
                      <Text style={styles.paymentText}>{sale.paymentMethod || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEditSale(sale)}
                      style={styles.editButton}
                    >
                      <MaterialIcons name="edit" size={16} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSale(sale)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>
                
                <Text style={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </Text>
                
                <TouchableOpacity
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
                 )}
       </ScrollView>
       </View>
     </SafeAreaView>
    );
  } catch (error) {
    console.error('Error in Sales component:', error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color="#dc2626" />
            <Text style={styles.errorText}>Something went wrong</Text>
            <TouchableOpacity
              onPress={onBack}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Edit Sale Modal
  if (showEditModal && editingSale) {
    return (
      <EditSale
        sale={editingSale!}
        onClose={() => {
          setShowEditModal(false);
          setEditingSale(null);
        }}
        onSaleUpdated={handleSaleUpdated}
        token={token}
      />
    );
  }

      {/* Delete Sale Modal */}
      {showDeleteModal && deletingSale && (
        <DeleteAuthPopup
          title="Delete Sale"
          message={`Are you sure you want to delete this sale for ${deletingSale?.customerId?.name || 'Unknown Customer'}?`}
          onConfirm={async (mobile: string, password: string) => {
            try {
              // Verify credentials first
              await apiClient.post('/api/auth/verify', { mobile, password });
              // If verification successful, proceed with deletion
              await handleConfirmDelete();
            } catch (error: any) {
              Alert.alert('Error', 'Invalid credentials');
            }
          }}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingSale(null);
          }}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    fontSize: 14,
  },
  customerFilterText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  salesList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  saleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleTypeBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saleTypeText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '500',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  productsContainer: {
    marginBottom: 12,
  },
  productText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  amountReceived: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  saleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cashCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  onlineCard: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  totalCard: {
    backgroundColor: '#f3e8ff',
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
}); 