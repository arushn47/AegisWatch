import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, ShieldCheck, Zap } from 'lucide-react';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Brand & Value Prop */}
        <div className="md:w-5/12 bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant/30 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-error"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface tracking-tight">AegisWatch</h2>
            </div>
            
            <p className="text-on-surface-variant font-body-md leading-relaxed mb-8">
              Join the global intelligence grid. Access real-time hazard telemetry, predictive crisis modeling, and secure civil defense alerts.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-tertiary mt-0.5" />
                <span className="text-sm text-outline">Sub-second global hazard latency</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm text-outline">Encrypted cross-border telemetry</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-12">
            <p className="text-xs font-label-mono-sm text-on-surface-variant/50 uppercase tracking-widest">Authorized Personnel Only</p>
          </div>
        </div>
        
        {/* Right Side: Auth Form */}
        <div className="md:w-7/12 p-8 relative bg-surface-container-lowest">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="max-w-sm mx-auto w-full pt-4">
            <h3 className="font-headline-sm text-2xl font-bold text-on-surface mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-8">
              {isLogin ? 'Sign in to your account to continue.' : 'Create a new account to get started.'}
            </p>
            
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-medium">
                {error}
              </div>
            )}
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-sm border border-gray-200 mb-6"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-outline-variant/30 flex-1"></div>
              <span className="text-xs font-label-mono-sm text-outline uppercase tracking-wider">or encrypted email</span>
              <div className="h-px bg-outline-variant/30 flex-1"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Your Email"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-primary hover:text-primary-fixed font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
