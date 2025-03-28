import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Input, Button } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();

  const validateInput = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    try {
      setErrorMessage('');
      
      if (!validateInput()) {
        return;
      }

      setLoading(true);
      await login(email.trim(), password);
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(
        error?.message || 'Invalid credentials. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Input
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            disabled={loading}
            errorMessage={errorMessage}
            onFocus={clearError}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            disabled={loading}
            onFocus={clearError}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Button
            title={loading ? 'Signing in...' : 'Login'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000000'
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 0
  },
  input: {
    fontSize: 16,
    color: '#000000'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center'
  },
  registerText: {
    fontSize: 14,
    color: '#8E8E93'
  },
  registerHighlight: {
    color: '#007AFF',
    fontWeight: '600'
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14
  }
});

export default LoginScreen;