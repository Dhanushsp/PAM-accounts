import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../lib/axios-config';

interface PriceHistoryEntry {
  _id: string;
  oldPricePerPack: number;
  newPricePerPack: number;
  oldPricePerKg: number;
  newPricePerKg: number;
  updateDate: string;
  reason: string;
  updatedBy: {
    name: string;
    email: string;
  };
}

interface PriceHistoryDisplayProps {
  productId: string;
  productName: string;
}

export default function PriceHistoryDisplay({ productId, productName }: PriceHistoryDisplayProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/price-history/${productId}`);
      setPriceHistory(response.data);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && priceHistory.length === 0) {
      fetchPriceHistory();
    }
    setShowHistory(!showHistory);
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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggleHistory} style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Price History</Text>
        <MaterialIcons
          name={showHistory ? "expand-less" : "expand-more"}
          size={20}
          color="#2563eb"
        />
      </TouchableOpacity>

      {showHistory && (
        <View style={styles.historyContent}>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : priceHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>No price history available</Text>
          ) : (
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {priceHistory.map((entry) => (
                <View key={entry._id} style={styles.historyItem}>
                  <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyDate}>
                      {formatDate(entry.updateDate)}
                    </Text>
                    <Text style={styles.historyUser}>
                      by {entry.updatedBy?.name || 'Unknown'}
                    </Text>
                  </View>
                  
                  <View style={styles.priceChangeRow}>
                    <Text style={styles.priceChangeLabel}>Pack Price:</Text>
                    <Text style={styles.oldPrice}>₹{entry.oldPricePerPack}</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#6b7280" />
                    <Text style={styles.newPrice}>₹{entry.newPricePerPack}</Text>
                  </View>
                  
                  <View style={styles.priceChangeRow}>
                    <Text style={styles.priceChangeLabel}>Kg Price:</Text>
                    <Text style={styles.oldPrice}>₹{entry.oldPricePerKg}</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#6b7280" />
                    <Text style={styles.newPrice}>₹{entry.newPricePerKg}</Text>
                  </View>
                  
                  {entry.reason && (
                    <Text style={styles.reasonText}>Reason: {entry.reason}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  historyContent: {
    marginTop: 8,
    maxHeight: 200,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 16,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  historyUser: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceChangeLabel: {
    fontSize: 12,
    color: '#374151',
    width: 60,
  },
  oldPrice: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginRight: 4,
  },
  newPrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginLeft: 4,
  },
  reasonText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 