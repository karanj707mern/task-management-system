'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ROUTES, LOCAL_STORAGE_KEYS } from '@/constants';
import { Bell, Layout, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setTheme: setAppTheme } = useAppTheme();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    workspaceName: 'Task Management System',
    timezone: 'UTC',
    theme: 'system',
    emailNotifications: true,
    taskUpdates: true,
    teamUpdates: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    if (savedTheme) {
      setFormData((prev) => ({ ...prev, theme: savedTheme }));
    }
  }, []);

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, formData.theme);
    setAppTheme(formData.theme);
    setTimeout(() => {
      setSaved(true);
      setSaving(false);
    }, 300);
  };

  if (authLoading || !isAuthenticated) {
        return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-base text-muted-foreground mt-1">Workspace preferences and notification defaults.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Layout className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">Workspace</CardTitle>
                  <CardDescription>Basic workspace configuration.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace name</Label>
                  <Input id="workspaceName" value={formData.workspaceName} onChange={(e) => updateField('workspaceName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Asia/Kolkata">India Standard Time</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2 sm:max-w-xs">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => {
                      updateField('theme', e.target.value);
                      setAppTheme(e.target.value);
                      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, e.target.value);
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                  <CardDescription>Choose what you want to be notified about.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  ['emailNotifications', 'Email notifications', 'Receive task and team updates by email.'],
                  ['taskUpdates', 'Task updates', 'Notify me when a task is assigned, updated, or completed.'],
                  ['teamUpdates', 'Team updates', 'Notify me when team membership changes.'],
                ].map(([key, label, description]) => (
                  <label key={key} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(event) => updateField(key as keyof typeof formData, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                     <span>
                       <span className="block font-medium text-foreground">{label}</span>
                       <span className="block text-base text-muted-foreground">{description}</span>
                     </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">Security</CardTitle>
                  <CardDescription>Security defaults for the workspace.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-base text-foreground">
                Password policy, session timeout, and SSO settings can be connected here once backend policies are enabled.
              </div>
            </CardContent>
          </Card>

          {saved && (
            <Card className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/50">
              <CardContent className="pt-6 flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-base text-emerald-700 dark:text-emerald-300">Settings saved locally.</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
         </form>
        </div>
      </div>
    );
  }
