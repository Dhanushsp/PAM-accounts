import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';


export default function CustomerSalesModal({ customer, onClose, onEditSale, onRefresh }) {
  if (!customer) return null;

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <ScrollView className="bg-white w-11/12 max-w-2xl rounded-2xl p-4 space-y-4 max-h-[90vh]">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-blue-700">
            Sales History: {customer.name}
          </Text>
          <View className="flex-row items-center space-x-2">
            {onRefresh && (
              <TouchableOpacity onPress={onRefresh}>
                <Text className="text-blue-600 text-sm font-semibold">↻ Refresh</Text>
              </TouchableOpacity>
            )}
            <Pressable onPress={onClose}>
              <Text className="text-gray-400 text-2xl font-bold">&times;</Text>
            </Pressable>
          </View>
        </View>

        {customer.sales && customer.sales.length > 0 ? (
          customer.sales
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((sale) => (
              <View key={sale._id} className="border-b pb-2 mb-2">
                <Text className="text-xs text-gray-500">
                  {sale.date
                    ? new Date(sale.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Date not available'} - {sale.saleType?.toUpperCase()}
                </Text>
                <View className="mt-1">
                  {sale.products.map((product) => (
                    <Text key={product._id} className="text-sm text-gray-700">
                      • {product.productName} - Qty: {product.quantity}, Price: ₹{product.price}
                    </Text>
                  ))}
                </View>
                <Text className="text-xs text-gray-600 mt-1">
                  Total: ₹{sale.totalPrice} | Received: ₹{sale.amountReceived} | Method: {sale.paymentMethod}
                </Text>
                <TouchableOpacity
                  onPress={() => onEditSale(sale)}
                  className="flex-row items-center mt-2"
                >
                  <Text className="text-blue-600 text-sm font-semibold mr-1">Edit</Text>
                  <Icon name="edit" size={14} color="#2563EB" /> {/* blue-600 */}
                </TouchableOpacity>
              </View>
            ))
        ) : (
          <Text className="text-gray-600">No sales history available.</Text>
        )}

        <View className="mt-2 items-end">
          <Text className="text-blue-700 font-bold">
            Current Credit: ₹{customer.credit}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
