import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function SideNav({ isOpen, onClose, onLogout, onNavigate }: SideNavProps) {
  const translateX = new Animated.Value(-width);

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -width,
      duration: 300,
      useNativeDriver: false, // Changed to false to avoid native driver issues
    }).start();
  }, [isOpen]);

  const menuItems = [
    { title: 'Dashboard', icon: '📊', onPress: () => onNavigate('dashboard') },
    { title: 'Customers', icon: '👥', onPress: () => onNavigate('customers') },
    { title: 'Products', icon: '📦', onPress: () => onNavigate('products') },
    { title: 'Sales', icon: '💰', onPress: () => onNavigate('sales') },
    { title: 'Reports', icon: '📈', onPress: () => onNavigate('reports') },
    { title: 'Settings', icon: '⚙️', onPress: () => onNavigate('settings') },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Side Navigation */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width * 0.8,
          height: '100%',
          backgroundColor: '#1e293b',
          transform: [{ translateX }],
          zIndex: 1000,
  
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f8fafc' }}>
              <Text>PAM</Text><Text style={{ color: '#3b82f6' }}>-Accounts</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
              Business Management
            </Text>
          </View>

          {/* Menu Items */}
          <View style={{ flex: 1, paddingTop: 20 }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#334155',
                }}
                onPress={item.onPress}
              >
                <Text style={{ fontSize: 20, marginRight: 16 }}>{item.icon}</Text>
                <Text style={{ fontSize: 16, color: '#f8fafc', fontWeight: '500' }}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#334155' }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#dc2626',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={onLogout}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                🚪 Logout
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
} 