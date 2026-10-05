import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ensureUserProfile } from '../lib/preferences';
import { X, Mail, Lock, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

/**
 * Supabase surfaces raw Postgres/Auth errors. The signup trigger failure is
 * cryptic and very actionable to fix, so translate the common cases.
 */
const FRIENDLY_ERRORS: { match: RegExp; message: string }[] = [
  {
    match: /database error saving new user/i,
    message:
      'Signup was rejected by the database. A trigger on auth.users almost certainly failed — run supabase/fix-signup.sql in your Supabase SQL Editor to repair it.',
  },
  {
    match: /user already registered|already been registered/i,
    message: 'That email already has an account. Try signing in instead.',
  },
  {
    match: /password should be at least/i,
    message: 'That password is too short. Use at least 6 characters.',
  },
  {
    match: /email not confirmed/i,
    message: 'That email is not confirmed yet. Check your inbox for the confirmation link.',
  },
  {
    match: /invalid login credentials/i,
    message: 'Incorrect email or password.',
  },
  {
    match: /rate limit|too many requests/i,
    message: 'Too many attempts. Wait a minute and try again.',
  },
];

function friendlyAuthError(raw: string | undefined): string {
  const text = raw || 'An error occurred during authentication.';
  return FRIENDLY_ERRORS.find((entry) => entry.match.test(text))?.message ?? text;
}

const MODE_COPY: Record<AuthMode, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account to continue.',
    cta: 'Sign In',
  },
  signup: {
    title: 'Create Account',
    subtitle: 'Create a new account to get started.',
    cta: 'Create Account',
  },
  forgot: {
    title: 'Reset Password',
    subtitle: 'Enter your email and we will send you a secure reset link.',
    cta: 'Send Reset Link',
  },
};

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) {
          await ensureUserProfile(supabase, data.user);
        }
        onClose();
      } else if (mode === 'signup') {
        const displayName = email.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: displayName,
              full_name: displayName,
              avatar_url: avatarUrl || null,
            },
          },
        });
        // Clear the URL field after a successful submit so a re-submit
        // (e.g. email confirmation flow) does not re-use a stale value.
        if (!error) setAvatarUrl('');
        if (error) throw error;
        if (data.session?.user) {
          await ensureUserProfile(supabase, data.session.user);
          onClose();
        } else {
          // Confirmation required: swap to an inline notice instead of alert().
          setMode('login');
          setNotice(
            `Confirmation link sent to ${email}. Check your inbox (and spam) to activate your account, then sign in.`
          );
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice(
          `If an account exists for ${email}, a password reset link is on its way.`
        );
      }
    } catch (err: any) {
      setError(friendlyAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setNotice(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(friendlyAuthError(err?.message || 'Google authentication failed.'));
    }
  };

  const copy = MODE_COPY[mode];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div
        ref={modalRef}
        className="w-full max-w-4xl my-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Brand & Value Prop */}
        <div className="hidden md:flex md:w-5/12 bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant/30 p-8 flex-col justify-between relative overflow-hidden">
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
        <div className="w-full md:w-7/12 p-6 sm:p-8 relative bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-sm mx-auto w-full pt-4">
            <h3 className="font-headline-sm text-2xl font-bold text-on-surface mb-2">{copy.title}</h3>
            <p className="text-sm text-on-surface-variant mb-8">{copy.subtitle}</p>

            {notice && (
              <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
                {notice}
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-medium">
                {error}
              </div>
            )}

            {mode !== 'forgot' && (
              <>
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
              </>
            )}

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

              {mode !== 'forgot' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Password"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Avatar URL (optional)"
                  />
                  <p className="text-[10px] text-outline mt-1 pl-4">
                    Optional — Google signups get one automatically.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  copy.cta
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                  <span className="text-on-surface-variant">
                    No account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-primary hover:text-primary-fixed font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
                    >
                      Sign Up
                    </button>
                  </span>
                </>
              ) : mode === 'signup' ? (
                <span className="text-on-surface-variant mx-auto">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary hover:text-primary-fixed font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
