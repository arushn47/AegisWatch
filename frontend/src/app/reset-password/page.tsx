'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

type Status = 'checking' | 'ready' | 'saving' | 'done' | 'invalid';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The recovery link establishes a session client-side (PKCE exchange) and
    // fires PASSWORD_RECOVERY. Fall back to checking for an existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !cancelled) setStatus('ready');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setStatus((prev) => (prev === 'ready' ? prev : session ? 'ready' : 'invalid'));
    });

    // Give the URL-based exchange a moment to land before declaring failure.
    const timer = setTimeout(() => {
      if (!cancelled) setStatus((prev) => (prev === 'checking' ? 'invalid' : prev));
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('saving');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus('ready');
      return;
    }
    setStatus('done');
    setTimeout(() => {
      window.location.href = '/';
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container rounded-2xl border border-outline-variant/30 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline-sm text-xl font-bold text-on-surface">Reset Password</h1>
            <p className="text-xs text-on-surface-variant font-label-mono-sm uppercase tracking-wider">
              AegisWatch Secure Recovery
            </p>
          </div>
        </div>

        {status === 'checking' && (
          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Verifying reset link...</span>
          </div>
        )}

        {status === 'invalid' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>This reset link is invalid or has expired. Request a new one from the sign-in dialog.</span>
            </div>
            <Link
              href="/"
              className="text-center w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-4 rounded-xl transition-all"
            >
              Back to dashboard
            </Link>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-on-surface font-medium">Password updated.</p>
            <p className="text-sm text-on-surface-variant">Redirecting you to the dashboard...</p>
          </div>
        )}

        {(status === 'ready' || status === 'saving') && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">{error}</div>
            )}
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
                placeholder="New password"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-60"
            >
              {status === 'saving' ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
