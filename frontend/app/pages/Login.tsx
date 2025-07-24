import React, { useState } from 'react';
import { SafeAreaView, TextInput, View, Text, TouchableOpacity } from 'react-native';
import axios from 'axios';

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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center bg-white">
        <View className="bg-white rounded-lg p-5 w-4/5">
          <Text className="text-2xl font-bold mb-6 text-center text-blue-700">Login</Text>
          <View className="space-y-4">
            <TextInput
              className="border border-gray-300 p-2 rounded text-black bg-white"
              placeholder="Mobile"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="number-pad"
              placeholderTextColor="#888"
            />
            <TextInput
              className="border border-gray-300 p-2 rounded text-black bg-white"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 py-2 rounded"
            >
              <Text className="text-center text-white font-semibold">
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? <Text className="mt-4 text-red-500 text-center">{error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
