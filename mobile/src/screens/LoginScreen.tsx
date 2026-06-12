import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center px-6 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="login-screen"
    >
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">Investo</Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Sign in to your portfolio
      </Text>

      {error && (
        <Text className="text-red-600 text-sm mb-3 text-center" testID="login-error">
          {error}
        </Text>
      )}

      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-3"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        testID="input-email"
      />
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-3"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        testID="input-password"
      />

      <TouchableOpacity
        className={`rounded-lg py-3.5 items-center mt-2 ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
        onPress={handleLogin}
        disabled={loading}
        testID="login-button"
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-base font-semibold">Sign In</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
