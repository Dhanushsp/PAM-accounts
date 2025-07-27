import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Pressable, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  activePage?: string;
}

export default function SideNav({ isOpen, onClose, onLogout, onNavigate, activePage }: SideNavProps) {
  const insets = useSafeAreaInsets();
  const translateX = React.useRef(new Animated.Value(-width)).current;

  // Adjust menu width to account for safe area insets on mobile
  const menuWidth = Platform.OS === 'web' ? width * 0.75 : Math.min(width * 0.75, width - insets.left - insets.right);

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -menuWidth,
      duration: 280,
      useNativeDriver: true, // Use native driver for smoother animation
    }).start();
  }, [isOpen, menuWidth]);

  const menuItems = [
    { title: 'Dashboard', icon: 'dashboard', page: 'dashboard' },
    { title: 'Customers', icon: 'people', page: 'customers' },
    { title: 'Products', icon: 'inventory', page: 'products' },
    { title: 'Sales', icon: 'attach-money', page: 'sales' },
    { title: 'Expenses', icon: 'receipt', page: 'expenses' },
    { title: 'Purchase', icon: 'shopping-cart', page: 'purchase' },
    { title: 'Personal Finance', icon: 'account-balance-wallet', page: 'personal-finance' },
    { title: 'Reports', icon: 'bar-chart', page: 'reports' },
    { title: 'Settings', icon: 'settings', page: 'settings' },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />
      )}

      {/* Side Navigation */}
      <Animated.View
        style={[
          styles.sideNav,
          { width: menuWidth, transform: [{ translateX }] },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 18 }]}>
            <Text style={styles.headerTitle}>
              PAM<Text style={styles.headerTitleAccent}>-Accounts</Text>
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, idx) => {
              const isActive = activePage === item.page;
              return (
                <Pressable
                  key={idx}
                  onPress={() => onNavigate(item.page)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    pressed && !isActive && styles.menuItemPressed,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={isActive ? '#2563EB' : '#64748b'}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      isActive && styles.menuTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Logout */}
          <View style={[styles.logoutContainer, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <MaterialIcons name="logout" size={18} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  sideNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#fff',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 10,
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  headerTitleAccent: {
    color: '#3b82f6',
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    padding: 6,
  },
  menuContainer: {
    flex: 1,
    marginTop: 16, // Increased for better spacing
    paddingHorizontal: 8, // Added padding for consistent alignment
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Platform.OS === 'web' ? 6 : 8, // Slightly larger spacing on mobile
    paddingVertical: Platform.OS === 'web' ? 12 : 14, // Larger padding on mobile
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#e0e7ef',
  },
  menuItemPressed: {
    backgroundColor: '#f8fafc',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuText: {
    fontSize: Platform.OS === 'web' ? 15 : 16, // Slightly larger text on mobile
    color: '#334155',
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 15 : 16, // Slightly larger text on mobile
    fontWeight: '600',
    marginLeft: 8,
  },
});