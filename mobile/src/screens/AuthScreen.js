import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { COLORS } from '../theme';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [screen, setScreen] = useState('auth');
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.location);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return Alert.alert('Required', 'Enter your email');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      Alert.alert('Sent', data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setScreen('reset');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      Alert.alert('Success', data.message);
      setScreen('auth');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'forgot') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.logo}>Drip<Text style={styles.logoAccent}>Vibe</Text></Text>
        <Text style={styles.tagline}>Reset your password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={COLORS.muted}
          value={forgotEmail}
          onChangeText={setForgotEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.btn} onPress={handleForgot} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setScreen('auth')}>
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (screen === 'reset') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.logo}>Drip<Text style={styles.logoAccent}>Vibe</Text></Text>
        <Text style={styles.tagline}>Enter your new password</Text>
        <TextInput
          style={styles.input}
          placeholder="Reset Token"
          placeholderTextColor={COLORS.muted}
          value={resetToken}
          onChangeText={setResetToken}
          autoCapitalize="none"
        />
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="New Password"
            placeholderTextColor={COLORS.muted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPassword(v => !v)}>
            <Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Reset Password</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setScreen('auth')}>
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>Drip<Text style={styles.logoAccent}>Vibe</Text></Text>
      <Text style={styles.tagline}>Your AI-powered style companion</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => setIsLogin(true)}>
          <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => setIsLogin(false)}>
          <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {!isLogin && (
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.muted} value={form.name} onChangeText={set('name')} />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.muted}
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Password"
          placeholderTextColor={COLORS.muted}
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
          <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      {isLogin && (
        <View style={styles.forgotRow}>
          <TouchableOpacity onPress={() => setScreen('forgot')}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLogin && (
        <TextInput style={styles.input} placeholder="City (e.g. New York)" placeholderTextColor={COLORS.muted} value={form.location} onChangeText={set('location')} />
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isLogin ? 'Login' : 'Create Account'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: 80, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  logoAccent: { color: COLORS.primary },
  tagline: { fontSize: 14, color: COLORS.muted, marginBottom: 40 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.card2, borderRadius: 10, padding: 4, marginBottom: 24, width: '100%' },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  tabTextActive: { color: '#000' },
  input: { width: '100%', backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, color: COLORS.text, marginBottom: 12, fontSize: 15 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8, gap: 8 },
  eyeBtn: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, justifyContent: 'center', alignItems: 'center' },
  eyeIcon: { fontSize: 18 },
  forgotRow: { width: '100%', alignItems: 'flex-end', marginBottom: 12 },
  forgotLink: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  btn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  backLink: { marginTop: 16, padding: 8 },
  backLinkText: { fontSize: 14, color: COLORS.muted },
});
