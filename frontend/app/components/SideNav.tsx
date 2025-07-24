import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const translateX = React.useRef(new Animated.Value(-width)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -width,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const menuItems = [
    { title: 'Dashboard', icon: 'dashboard', page: 'dashboard' },
    { title: 'Customers', icon: 'people', page: 'customers' },
    { title: 'Products', icon: 'inventory', page: 'products' },
    { title: 'Sales', icon: 'attach-money', page: 'sales' },
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
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 999,
          }}
          onPress={onClose}
        />
      )}

      {/* Side Navigation */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width * 0.75,
          height: '100%',
          backgroundColor: '#fff',
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          transform: [{ translateX }],
          zIndex: 1000,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#2563EB',
            }}>
              PAM<Text style={{ color: '#3b82f6' }}>-Accounts</Text>
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 999,
                padding: 6,
              }}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Menu */}
          <View style={{ flex: 1, marginTop: 10 }}>
            {menuItems.map((item, idx) => {
              const isActive = activePage === item.page;
              return (
                <Pressable
                  key={idx}
                  onPress={() => onNavigate(item.page)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginHorizontal: 16,
                      marginVertical: 6,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isActive
                        ? '#e0e7ef'
                        : pressed
                        ? '#f8fafc'
                        : 'transparent',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={isActive ? '#2563EB' : '#64748b'}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={{
                    fontSize: 15,
                    color: isActive ? '#2563EB' : '#334155',
                    fontWeight: isActive ? '600' : '500',
                  }}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Logout */}
          <View style={{
            paddingHorizontal: 20,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
          }}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: '#dc2626',
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="logout" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}
