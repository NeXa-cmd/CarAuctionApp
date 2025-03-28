import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'react-native-image-picker';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const { register, loading, error } = useAuth();

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.error) {
        Alert.alert('Error', 'Failed to pick image: ' + response.error);
        return;
      }

      if (response.assets && response.assets[0]) {
        const source = response.assets[0];
        setProfileImage(source.uri);
      }
    });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`- At least ${minLength} characters long`);
    if (!hasUpperCase) errors.push('- At least one uppercase letter');
    if (!hasLowerCase) errors.push('- At least one lowercase letter');
    if (!hasNumbers) errors.push('- At least one number');
    if (!hasSpecialChar) errors.push('- At least one special character');

    return errors;
  };

  const handleRegister = async () => {
    try {
      // Check for empty fields
      if (!username || !email || !password || !confirmPassword) {
        Alert.alert(
          'Missing Information',
          'Please fill in all fields to create your account.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert(
          'Invalid Email',
          'Please enter a valid email address.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        Alert.alert(
          'Password Requirements',
          'Your password must include:\n' + passwordErrors.join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        Alert.alert(
          'Passwords Do Not Match',
          'Please make sure your passwords match.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create form data for multipart request
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('email', email.trim());
      formData.append('password', password);

      // Add profile image if selected
      if (profileImage) {
        formData.append('profileImage', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile-image.jpg'
        });
      }

      await register(formData);
    } catch (err) {
      Alert.alert(
        'Registration Failed',
        err.message || 'An error occurred during registration. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: profileImage || 'https://via.placeholder.com/100'
            }}
            style={styles.avatar}
          />
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handleImagePick}
          >
            <Icon name="camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#007AFF80',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;