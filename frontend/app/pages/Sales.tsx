import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import DatePicker from '../components/DatePicker';

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
  const [customers, setCustomers] = useState<Array<{ _id: string; name: string }>>([]);
  
  const insets = useSafeAreaInsets();
  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  useEffect(() => {
    fetchCustomers();
    fetchSales();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [currentPage, filterFromDate, filterToDate, filterSaleType, filterPaymentMethod, filterCustomerId]);

  useEffect(() => {
    fetchSummary();
  }, [filterFromDate, filterToDate]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/customers`, {
        headers: { Authorization: token }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (filterFromDate) params.append('fromDate', filterFromDate);
      if (filterToDate) params.append('toDate', filterToDate);
      if (filterSaleType) params.append('saleType', filterSaleType);
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod);
      if (filterCustomerId) params.append('customerId', filterCustomerId);

      const response = await axios.get<SalesResponse>(`${BACKEND_URL}/api/sales?${params}`, {
        headers: { Authorization: token }
      });

      setSales(response.data.sales);
      setTotalPages(response.data.pagination.totalPages);
      setTotalSales(response.data.pagination.totalSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const params = new URLSearchParams();
      if (filterFromDate) params.append('fromDate', filterFromDate);
      if (filterToDate) params.append('toDate', filterToDate);

      const response = await axios.get<SalesSummary>(`${BACKEND_URL}/api/sales/summary?${params}`, {
        headers: { Authorization: token }
      });

      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
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
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedCustomerName = () => {
    if (!filterCustomerId) return 'All Customers';
    const customer = customers.find(c => c._id === filterCustomerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>{summary.totalSales}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹{summary.totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Amount Received</Text>
            <Text style={styles.summaryValue}>₹{summary.totalAmountReceived.toLocaleString()}</Text>
          </View>
        </View>
      )}

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
        <View style={styles.filterRow}>
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
        </View>
      </View>

      {/* Sales List */}
      <ScrollView style={styles.salesList} showsVerticalScrollIndicator={false}>
        {loading ? (
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
              <View key={sale._id} style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                  <View style={styles.saleTypeBadge}>
                    <Text style={styles.saleTypeText}>{sale.saleType?.toUpperCase() || 'N/A'}</Text>
                  </View>
                </View>
                
                <Text style={styles.customerName}>{sale.customerId.name}</Text>
                
                <View style={styles.productsContainer}>
                  {sale.products.map((product, index) => (
                    <Text key={index} style={styles.productText}>
                      • {product.productName} x{product.quantity} @ ₹{product.price}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.saleFooter}>
                  <View style={styles.paymentInfo}>
                    <MaterialIcons name="attach-money" size={14} color="#64748b" />
                    <Text style={styles.totalPrice}>₹{sale.totalPrice}</Text>
                    <Text style={styles.amountReceived}>/ ₹{sale.amountReceived}</Text>
                  </View>
                  <View style={styles.paymentMethod}>
                    <MaterialIcons name="payment" size={16} color="#64748b" />
                    <Text style={styles.paymentText}>{sale.paymentMethod}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginBottom: 4,
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
    marginBottom: 12,
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
    paddingHorizontal: 16,
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
}); 