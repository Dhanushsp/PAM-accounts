import React, { useState } from 'react';
import { SafeAreaView, TextInput, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import KeyboardAwareView from '../components/KeyboardAwareView';

interface LoginProps {
  setToken: (token: string) => void;
}

export default function Login({ setToken }: LoginProps) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleLogin = async () => {
    if (!mobile || !password) {
      setError('Please enter mobile and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { mobile, password });
      setToken(res.data.token);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareView
        style={styles.keyboardAwareContainer}
        contentContainerStyle={styles.contentContainer}
        extraScrollHeight={100}
      >
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <Text style={styles.title}>Login</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Mobile"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="number-pad"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
      </KeyboardAwareView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF8FF', // equivalent to bg-blue-50
  },
  keyboardAwareContainer: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
  },
  loginBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%', // w-4/5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1d4ed8',
  },
  inputGroup: {
    // space-y-4
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db', // border-gray-300
    padding: 8,
    borderRadius: 8,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 16, // space-y-4
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2563eb', // bg-blue-600
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
