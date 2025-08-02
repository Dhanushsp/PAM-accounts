import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

interface Product {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
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
}

export default function CustomerSalesModal({ customer, onClose, onEditSale, onRefresh }: CustomerSalesModalProps) {
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

        <ScrollView style={styles.salesScroll} contentContainerStyle={{ paddingBottom: 8 }}>
        {customer.sales && customer.sales.length > 0 ? (
          (() => {
            // First, sort all sales by date (latest first)
            const sortedSales = [...customer.sales].sort((a: Sale, b: Sale) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateB - dateA; // Descending order (latest first)
            });

            // Group sales by date after sorting
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

            // Convert to array and sort by the actual date (not the formatted string)
            const sortedDateEntries = Object.entries(salesByDate)
              .map(([dateKey, sales]) => ({
                dateKey,
                sales,
                // Use the first sale's date for sorting (all sales in group have same date)
                sortDate: new Date(sales[0].date).getTime()
              }))
              .sort((a, b) => b.sortDate - a.sortDate); // Descending order (latest first)

            // Render the sorted date groups
            return sortedDateEntries.map(({ dateKey, sales }) => (
              <View key={dateKey} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{dateKey}</Text>
                {sales.map((sale: Sale) => (
                      <View key={sale._id} style={styles.saleBox}>
                        <View style={styles.saleBoxHeader}>
                          <Text style={styles.saleTime}>
                            {sale.date
                              ? new Date(sale.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Time not available'}
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
        </ScrollView>

        {/* Credit Summary */}
        <View style={styles.creditSummary}>
          <Text style={styles.creditSummaryText}>Current Credit: ₹{customer.credit}</Text>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  container: {
    width: '91%',
    maxWidth: 480,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    maxHeight: '90%',
    position: 'relative',
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
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    color: '#1d4ed8',
  },
  refreshButton: {
    marginLeft: 8,
  },
  customerName: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  salesScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    maxHeight: 350,
  },
  saleBox: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  saleBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  saleTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
  saleTypeBadgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  productsList: {
    marginTop: 4,
    marginBottom: 8,
  },
  productText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  productQty: {
    color: '#9ca3af',
  },
  productPrice: {
    color: '#6b7280',
  },
  saleBoxFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  saleTotal: {
    fontSize: 12,
    color: '#4b5563',
  },
  saleAmountReceived: {
    color: '#9ca3af',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noSalesText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  creditSummary: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
  },
  creditSummaryText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  saleTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
