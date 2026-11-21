import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/parceloServices';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, register } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [otpPhone, setOtpPhone] = useState('+91 98765 43210');
  const [otpCode, setOtpCode] = useState('4921');
  const [otpSent, setOtpSent] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const validateRegister = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required.';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid email is required.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (/^\d+$/.test(password)) errors.password = 'Password cannot be entirely numeric.';
    if (password !== passwordConfirm) errors.passwordConfirm = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);
    try {
      await login(email, password);
      closeAuthModal();
    } catch (err) {
      setFieldErrors({ general: err.response?.data?.detail || 'Invalid email or password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        password_confirm: passwordConfirm,
      });
      closeAuthModal();
    } catch (err) {
      const respData = err.response?.data || {};
      const newErrors = {};
      if (respData.email) newErrors.email = Array.isArray(respData.email) ? respData.email[0] : respData.email;
      if (respData.phone) newErrors.phone = Array.isArray(respData.phone) ? respData.phone[0] : respData.phone;
      if (respData.password) newErrors.password = Array.isArray(respData.password) ? respData.password[0] : respData.password;
      if (respData.detail) newErrors.general = respData.detail;
      setFieldErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.requestOtp(otpPhone);
      setOtpSent(true);
      showToast('Simulated OTP dispatched: 4921');
    } catch (err) {
      showToast('Error requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.verifyOtp(otpPhone, otpCode, 'Privé Member');
      const { user: userData, access, refresh } = res.data;
      localStorage.setItem('parcelo_access_token', access);
      localStorage.setItem('parcelo_refresh_token', refresh);
      localStorage.setItem('parcelo_user', JSON.stringify(userData));
      window.location.reload();
    } catch (err) {
      showToast('Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMock = (provider) => {
    showToast(`${provider} OAuth is an optional external provider. Using email login is recommended.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl theme-bg-card border theme-border theme-shadow p-6 sm:p-7 overflow-hidden">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center hover:opacity-80 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl theme-accent-bg mx-auto flex items-center justify-center font-serif font-black text-2xl shadow-md mb-2">
            P
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">Parcelo Privé Access</h3>
          <p className="text-xs theme-text-secondary mt-1">
            Bespoke culinary deliveries & AI food concierge
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-2xl theme-bg-secondary border theme-border mb-5">
          <button
            type="button"
            onClick={() => setAuthModalTab('login')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              authModalTab === 'login' ? 'theme-accent-bg shadow-sm' : 'theme-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab('register')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              authModalTab === 'register' ? 'theme-accent-bg shadow-sm' : 'theme-text-secondary'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab('otp')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              authModalTab === 'otp' ? 'theme-accent-bg shadow-sm' : 'theme-text-secondary'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {fieldErrors.general && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 theme-text-secondary" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@parcelo.luxury"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link has been dispatched to your email.')}
                  className="text-[11px] theme-accent-text hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 theme-text-secondary" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Privé'}
            </button>
          </form>
        )}

        {/* REGISTER FORM (FR-1.1, FR-1.2) */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 theme-text-secondary" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Mehta"
                  className="w-full pl-9 pr-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              {fieldErrors.fullName && <p className="text-[10px] text-rose-400 mt-0.5">{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 theme-text-secondary" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aarav@domain.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              {fieldErrors.email && <p className="text-[10px] text-rose-400 mt-0.5">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 theme-text-secondary" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              {fieldErrors.phone && <p className="text-[10px] text-rose-400 mt-0.5">{fieldErrors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Confirm</label>
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                />
              </div>
            </div>
            {fieldErrors.password && <p className="text-[10px] text-rose-400">{fieldErrors.password}</p>}
            {fieldErrors.passwordConfirm && <p className="text-[10px] text-rose-400">{fieldErrors.passwordConfirm}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Privé Registration'}
            </button>
          </form>
        )}

        {/* PHONE OTP FORM (FR-1.10) */}
        {authModalTab === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <p className="text-xs theme-text-secondary">
                  Enter your mobile number to receive a one-time verification passcode.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 rounded-xl theme-bg-secondary border theme-border text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md cursor-pointer"
                >
                  Send OTP Passcode
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-xs theme-text-secondary">
                  Passcode dispatched to <strong className="theme-text-primary">{otpPhone}</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1">Enter 4-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-[0.5em] font-serif text-xl font-bold py-2.5 rounded-xl theme-bg-secondary border theme-border focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl theme-accent-bg text-xs font-bold shadow-md cursor-pointer"
                >
                  Verify & Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* Social Buttons (FR-1.11) */}
        <div className="mt-5 pt-4 border-t theme-border text-center">
          <span className="text-[10px] theme-text-secondary uppercase tracking-wider block mb-3">
            Or connect with bespoke OAuth
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSocialMock('Google')}
              className="flex-1 py-2 px-3 rounded-xl theme-bg-secondary border theme-border text-xs font-semibold hover:opacity-85 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialMock('Apple')}
              className="flex-1 py-2 px-3 rounded-xl theme-bg-secondary border theme-border text-xs font-semibold hover:opacity-85 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
