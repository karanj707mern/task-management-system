'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@/constants';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="text-muted-foreground mt-2 text-sm">Enter your email and we&apos;ll send a reset link.</p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              If an account exists for {email}, a password reset link has been sent.
            </div>
            <Link href={ROUTES.LOGIN} className="block text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}

        <Link href={ROUTES.LOGIN} className="block text-center text-sm text-muted-foreground hover:text-foreground mt-6">
          Back to login
        </Link>
      </div>
    </div>
  );
}
