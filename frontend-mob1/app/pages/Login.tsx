import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';


export default function Login({ setToken }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { mobile, password });
      setToken(res.data.token);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
              <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
        <Text className="text-2xl font-bold mb-6 text-center text-blue-700">Login</Text>

        <View className="space-y-4">
          <TextInput
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Mobile"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="number-pad"
          />
          <TextInput
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleLogin}
            className="w-full bg-blue-600 py-2 rounded-lg"
          >
            <Text className="text-center text-white font-semibold">Login</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text className="mt-4 text-red-500 text-center">{error}</Text> : null}
      </View>
      </View>
    </SafeAreaView>
  );
}
