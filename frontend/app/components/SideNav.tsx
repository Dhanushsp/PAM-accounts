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
  const menuWidth = Platform.OS === 'web' ? width * 0.75 : Math.min(width * 0.8, 320);

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -menuWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, menuWidth]);

  const menuItems = [
    { title: 'Dashboard', icon: 'dashboard', page: 'home' },
    { title: 'Customers', icon: 'people', page: 'customers' },
    { title: 'Products', icon: 'inventory', page: 'products' },
    { title: 'Sales', icon: 'attach-money', page: 'sales' },
    { title: 'Expenses', icon: 'receipt', page: 'expenses' },
    { title: 'Purchase', icon: 'shopping-cart', page: 'purchase' },
    { title: 'Personal Finance', icon: 'account-balance-wallet', page: 'personal-finance' },
    // { title: 'Reports', icon: 'bar-chart', page: 'reports' },
    // { title: 'Settings', icon: 'settings', page: 'settings' },
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
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                PAM<Text style={styles.headerTitleAccent}>-Accounts</Text>
              </Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, idx) => {
              const isActive = activePage === item.page;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onNavigate(item.page)}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={22}
                      color={isActive ? '#2563eb' : '#64748b'}
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
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={20} color="#fff" style={styles.logoutIcon} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sideNav: {
    position: 'absolute',
    top: 0,
    bottom:0,
    left: 0,
    
    backgroundColor: '#ffffff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 0 },
    elevation: 15,
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  headerTitleAccent: {
    color: '#60a5fa',
  },
  closeButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  menuItem: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 16,
    width: 22,
  },
  menuText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  menuTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2563eb',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});