import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('signup'));
  const [screen, setScreen] = useState('auth');
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Forgot / reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.location);
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/app/wardrobe');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(data.message);
      // In production the token arrives via email; here we auto-fill it for demo
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setScreen('reset');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      toast.success(data.message);
      setScreen('auth');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  if (screen === 'forgot') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Drip<span>Vibe</span></div>
          <p className="auth-tagline">Reset your password</p>
          <form onSubmit={handleForgot} className="auth-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" className="back-link" onClick={() => setScreen('auth')}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (screen === 'reset') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Drip<span>Vibe</span></div>
          <p className="auth-tagline">Enter your new password</p>
          <form onSubmit={handleReset} className="auth-form">
            <input
              placeholder="Reset Token"
              value={resetToken}
              onChange={e => setResetToken(e.target.value)}
              required
            />
            <div className="password-field">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowNewPassword(v => !v)}>
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="back-link" onClick={() => setScreen('auth')}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Drip<span>Vibe</span></div>
        <p className="auth-tagline">Your AI-powered style companion</p>

        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Login</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input placeholder="Full Name" value={form.name} onChange={set('name')} required />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />

          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={set('password')}
              required
            />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {isLogin && (
            <div className="show-password-row">
              <button type="button" className="forgot-link" onClick={() => setScreen('forgot')}>
                Forgot password?
              </button>
            </div>
          )}

          {!isLogin && (
            <input placeholder="City (e.g. New York)" value={form.location} onChange={set('location')} />
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
