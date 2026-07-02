'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestAccessService } from '@/services/request-access.service';
import { ROUTES, SUCCESS_MESSAGES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function RequestAccessPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !department || !jobTitle) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await requestAccessService.submit({
        name,
        email,
        department,
        jobTitle,
        reason,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-slate-200/60 dark:bg-grid-slate-700/40 bg-[bottom_1px_center] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-[460px] mx-4">
        <Card className="backdrop-blur-2xl bg-card/80 rounded-3xl shadow-2xl border border-border/60 p-8 sm:p-10">
          <div className="text-center mb-10">
             <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-5">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Request Access</h1>
            <p className="text-muted-foreground mt-2 text-sm">Submit your details to get workspace access</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5 backdrop-blur-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-foreground text-sm backdrop-blur-sm">
              <p className="font-semibold mb-1">{SUCCESS_MESSAGES.REQUEST_SUBMITTED}</p>
              <p className="text-muted-foreground text-xs">Our team will review your request and you&apos;ll receive an email once approved.</p>
            </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Karan Patel"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Software Engineer"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for access <span className="text-muted-foreground">(optional)</span></Label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why you need access..."
                  rows={3}
                  disabled={isSubmitting}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold"
                disabled={isSubmitting || !name || !email || !department || !jobTitle}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have access?{' '}
              <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          2026 — Developed by Karan Patel
        </p>
      </div>
    </div>
  );
}
