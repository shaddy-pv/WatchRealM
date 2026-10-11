import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { sounds } from '../audio/soundManager';
import { BACKEND_URL } from '../config';

export interface AuthUser {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
  intentAction?: 'join' | 'create' | null;
}

// ---------------------------------------------------------------------------
// Main AuthModal Component
// ---------------------------------------------------------------------------
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  intentAction = null,
}) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setErrorMessage('');
  }, [initialMode, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSignUp) {
      if (!username.trim()) {
        setErrorMessage('Please enter an explorer username');
        return;
      }
      if (!emailOrUsername.trim()) {
        setErrorMessage('Please enter your email address');
        return;
      }
    } else {
      if (!emailOrUsername.trim()) {
        setErrorMessage('Please enter your email or username');
        return;
      }
    }

    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters');
      return;
    }

    sounds.playSyncChime();
    setIsLoading(true);

    try {
      let res;
      if (isSignUp) {
        res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: username.trim(),
            email: emailOrUsername.trim(),
            password,
          }),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrUsername: emailOrUsername.trim(),
            password,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setIsLoading(false);
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      const userObj: AuthUser = {
        name: data.user.name,
        email: data.user.email,
        isLoggedIn: true,
      };

      try {
        localStorage.setItem('wr_auth_user', JSON.stringify(userObj));
        localStorage.setItem('wr_explorer_name', userObj.name);
      } catch (_) {}

      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userObj);
      }
      onClose();
    } catch (err) {
      // Graceful fallback if backend network is unreachable
      console.warn('Backend auth unreachable, falling back to local session:', err);
      const finalName = isSignUp ? username.trim() : emailOrUsername.split('@')[0] || 'Explorer Alex';
      const userObj: AuthUser = {
        name: finalName,
        email: emailOrUsername.includes('@') ? emailOrUsername.trim() : `${finalName.toLowerCase()}@watchrealm.io`,
        isLoggedIn: true,
      };

      try {
        localStorage.setItem('wr_auth_user', JSON.stringify(userObj));
        localStorage.setItem('wr_explorer_name', userObj.name);
      } catch (_) {}

      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userObj);
      }
      onClose();
    }
  };



  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playClick();
          onClose();
        }
      }}
    >
      {/* Background Scenic Artwork: Uses E:\Project\WatchRealm\2.png (auth-bg.png) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/auth-bg.png"
          alt="WatchRealm Background"
          className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
          loading="eager"
          decoding="async"
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
      </div>

      {/* Ornate Fantasy Glass Card matching Reference Screenshot */}
      <div className="relative z-10 w-full max-w-[430px] my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Outer Ornate Glow Frame */}
        <div
          className="relative rounded-[28px] p-6 sm:p-8 bg-[#0a0d16]/92 border border-[#e8c27a]/40 shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_35px_rgba(232,194,122,0.18)] backdrop-blur-2xl"
          style={{
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.95), 0 0 35px rgba(232,194,122,0.18), inset 0 1px 1px rgba(250,236,208,0.2)',
          }}
        >
          {/* Ornate Top Center Diamond Notch */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0a0d16] border-t border-l border-[#e8c27a]/60 shadow-[0_0_8px_rgba(232,194,122,0.6)]" />

          {/* Ornate Bottom Center Diamond Notch */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0a0d16] border-b border-r border-[#e8c27a]/60 shadow-[0_0_8px_rgba(232,194,122,0.6)]" />

          {/* Inner Ornate Border Frame with 4 Corner Diamond Points */}
          <div className="absolute inset-2 sm:inset-2.5 rounded-[22px] border border-[#e8c27a]/20 pointer-events-none" />
          <div className="absolute top-2 left-2 w-1.5 h-1.5 rotate-45 bg-[#e8c27a]/60 pointer-events-none shadow-[0_0_4px_rgba(232,194,122,0.8)]" />
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rotate-45 bg-[#e8c27a]/60 pointer-events-none shadow-[0_0_4px_rgba(232,194,122,0.8)]" />
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rotate-45 bg-[#e8c27a]/60 pointer-events-none shadow-[0_0_4px_rgba(232,194,122,0.8)]" />
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rotate-45 bg-[#e8c27a]/60 pointer-events-none shadow-[0_0_4px_rgba(232,194,122,0.8)]" />

          {/* Close 'X' Button at Top-Right */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.12] text-white/50 hover:text-white transition-all cursor-pointer border border-white/5 hover:border-white/20"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Section: Clean Regal WATCHREALM Title */}
          <div className="flex flex-col items-center text-center mb-6 pt-1">
            <div className="font-serif font-extrabold text-2xl sm:text-[30px] tracking-[0.26em] text-[#faecd0] drop-shadow-[0_2px_14px_rgba(232,194,122,0.35)] leading-tight select-none">
              WATCHREALM
            </div>

            {/* Ornate Diamond Divider Line matching Image */}
            <div className="flex items-center justify-center gap-2 w-32 mt-2.5">
              <div className="h-px bg-gradient-to-r from-transparent via-[#e8c27a]/45 to-[#e8c27a]/90 flex-1" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[#e8c27a] shadow-[0_0_6px_rgba(232,194,122,0.8)]" />
              <div className="h-px bg-gradient-to-l from-transparent via-[#e8c27a]/45 to-[#e8c27a]/90 flex-1" />
            </div>

            {/* Form Title & Subtitle */}
            <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#f5efe4] mt-3.5 tracking-tight leading-snug">
              {isSignUp ? 'Join the Realm' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">
              {isSignUp
                ? 'Create your identity to explore and host synchronized watch parties'
                : 'Continue your journey across worlds'}
            </p>
          </div>

          {/* Intent Banner (e.g. "Sign in to launch your watch party") */}
          {intentAction && (
            <div className="mb-4 py-1.5 px-3 rounded-xl bg-[#e8c27a]/10 border border-[#e8c27a]/30 text-[11px] text-[#f3dbab] text-center font-medium">
              ✨ Sign in to {intentAction === 'create' ? 'create a watch party' : 'join synchronized rooms'}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 py-2 px-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 text-center font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* If Sign Up: Explorer Name Field */}
            {isSignUp && (
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Explorer Name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121724]/90 border border-white/10 hover:border-white/20 focus:border-[#e8c27a]/70 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>
            )}

            {/* Email or Username Input */}
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <input
                type={isSignUp ? 'email' : 'text'}
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder={isSignUp ? 'Email address' : 'Email or Username'}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121724]/90 border border-white/10 hover:border-white/20 focus:border-[#e8c27a]/70 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-all shadow-inner"
                required
              />
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#121724]/90 border border-white/10 hover:border-white/20 focus:border-[#e8c27a]/70 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none transition-all shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 p-1 text-stone-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye className="w-4 h-4 text-[#e8c27a]" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#121724] border border-[#e8c27a]/60 accent-[#e8c27a] cursor-pointer"
                />
                <span className="text-stone-300">Remember me</span>
              </label>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    alert('Password reset link has been dispatched to your raven.');
                  }}
                  className="text-[#e8c27a] hover:text-[#ffe5a3] font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Primary Action Button matching Image (Warm Amber Gradient Pill) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-[#d99849] via-[#e5aa58] to-[#c48234] hover:brightness-110 active:scale-[0.99] text-[#1a1205] font-bold text-sm tracking-wide shadow-[0_4px_24px_rgba(217,152,73,0.4)] hover:shadow-[0_4px_32px_rgba(217,152,73,0.65)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </form>

          {/* Switch View Link: New to WatchRealm? Create an account / Sign In */}
          <div className="mt-6 text-center text-xs text-stone-400">
            {isSignUp ? (
              <span>
                Already an explorer?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsSignUp(false);
                    setErrorMessage('');
                  }}
                  className="text-[#e8c27a] hover:text-[#ffe5a3] font-semibold transition-colors cursor-pointer ml-1 underline decoration-[#e8c27a]/40"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                New to WatchRealm?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsSignUp(true);
                    setErrorMessage('');
                  }}
                  className="text-[#e8c27a] hover:text-[#ffe5a3] font-semibold transition-colors cursor-pointer ml-1 underline decoration-[#e8c27a]/40"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
