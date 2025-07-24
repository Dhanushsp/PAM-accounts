import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
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
    <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
      <View className="w-11/12 max-w-xl rounded-3xl bg-white shadow-lg p-0 overflow-hidden max-h-[90vh]">
        {/* Floating Close Button */}
        <Pressable
          onPress={onClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 rounded-full p-2 shadow"
          style={{ elevation: 3 }}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>

        {/* Title & Refresh */}
        <View className="pt-6 pb-2 px-6 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <Text className="text-lg font-bold text-center flex-1 text-blue-700">Sales History</Text>
            {onRefresh && (
            <TouchableOpacity onPress={onRefresh} className="ml-2">
              <MaterialIcons name="refresh" size={22} color="#2563EB" />
              </TouchableOpacity>
            )}
        </View>
        <Text className="text-center text-gray-500 text-base font-medium mt-1 mb-2">{customer.name}</Text>

        <ScrollView className="px-4 pt-1 pb-2" style={{ maxHeight: '65vh' }}>
        {customer.sales && customer.sales.length > 0 ? (
          customer.sales
            .sort((a: Sale, b: Sale) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((sale: Sale) => (
                <View key={sale._id} className="mb-4 rounded-2xl bg-gray-50 px-4 py-3 shadow-sm">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-gray-400">
                  {sale.date
                    ? new Date(sale.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                            minute: '2-digit',
                      })
                        : 'Date not available'}
                    </Text>
                    {sale.saleType && (
                      <View className="bg-blue-100 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-xs text-blue-700 font-semibold">{sale.saleType.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View className="mt-1 mb-2">
                  {sale.products.map((product: Product) => (
                      <Text key={product._id} className="text-sm text-gray-700 mb-0.5">
                        • {product.productName} <Text className="text-gray-400">x{product.quantity}</Text> <Text className="text-gray-500">₹{product.price}</Text>
                    </Text>
                  ))}
                </View>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-xs text-gray-600">
                      <FontAwesome name="rupee" size={12} color="#64748b" /> {sale.totalPrice}  <Text className="text-gray-400">/ {sale.amountReceived}</Text>
                </Text>
                    <View className="flex-row items-center">
                      <MaterialIcons name="payment" size={14} color="#64748b" />
                      <Text className="text-xs text-gray-500 ml-1">{sale.paymentMethod}</Text>
                    </View>
                  </View>
                <TouchableOpacity
                  onPress={() => onEditSale(sale)}
                    className="flex-row items-center mt-2 self-end"
                >
                  <FontAwesome name="edit" size={14} color="#2563EB" />
                    <Text className="text-blue-600 text-xs font-semibold ml-1">Edit</Text>
                </TouchableOpacity>
              </View>
            ))
        ) : (
            <Text className="text-gray-400 text-center mt-8 mb-8">No sales history available.</Text>
        )}
        </ScrollView>

        {/* Credit Summary */}
        <View className="bg-blue-50 px-6 py-4 rounded-b-3xl border-t border-blue-100 items-center">
          <Text className="text-blue-700 font-bold text-lg">Current Credit: ₹{customer.credit}</Text>
        </View>
      </View>
    </View>
  );
}
