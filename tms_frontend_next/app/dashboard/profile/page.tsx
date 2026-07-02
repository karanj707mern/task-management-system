'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/users.service';
import { ROUTES, BACKEND_URL } from '@/constants';
import { formatDateTime, formatDateRelative } from '@/lib/utils';
import type { User } from '@/types';
import { User as UserIcon, Mail, Shield, Clock, Building2, Briefcase, Phone, CheckCircle, XCircle, Camera } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    jobTitle: '',
    phone: '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        department: data.department || '',
        jobTitle: data.jobTitle || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated, loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await userService.updateProfile(formData);
      setProfile(updated);
      updateUser(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[AVATAR] File selected:', file.name, file.type, file.size);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be less than 8MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('[AVATAR] Uploading via userService.uploadAvatar...');
      const result = await userService.uploadAvatar(file);
      console.log('[AVATAR] Upload result:', result);
      const updatedProfile = { ...profile!, avatar: result.avatarUrl };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSuccess('Avatar updated successfully.');
    } catch (err) {
      console.error('[AVATAR] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ');
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-base">Manage your personal information and preferences</p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadProfile}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-base text-emerald-700 dark:text-emerald-300">{success}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                   <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4 shadow-lg overflow-hidden relative group">
                    {profile.avatar ? (
                      <Image
                        src={`${BACKEND_URL}${profile.avatar}`}
                        alt={profile.name}
                        width={96}
                        height={96}
                        className="rounded-full object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      profile.name?.charAt(0).toUpperCase() || <UserIcon className="w-10 h-10" />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                      aria-label="Upload avatar"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label="Choose avatar image"
                  />
                   <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
                   <p className="text-base text-muted-foreground mt-1">{profile.email}</p>
                  <div className="mt-3">{getStatusBadge(profile.isActive)}</div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-base">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <span className="ml-auto font-medium text-foreground">{getRoleLabel(profile.role)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-auto font-medium text-foreground truncate max-w-[150px]">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Last login:</span>
                    <span className="ml-auto font-medium text-foreground">
                      {profile.lastLogin ? formatDateRelative(profile.lastLogin) : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-base">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Department:</span>
                    <span className="ml-auto font-medium text-foreground">{profile.department || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Job Title:</span>
                    <span className="ml-auto font-medium text-foreground">{profile.jobTitle || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-auto font-medium text-foreground">{profile.phone || '—'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground text-center">
                  Member since {formatDateTime(profile.createdAt)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={handleChange('name')} placeholder="Enter your full name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled className="bg-muted/50" />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={formData.department} onChange={handleChange('department')} placeholder="e.g. Engineering" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input id="jobTitle" value={formData.jobTitle} onChange={handleChange('jobTitle')} placeholder="e.g. Senior Developer" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleChange('phone')} placeholder="+1 (555) 000-0000" />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={loadProfile}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Account Status</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last login: {profile.lastLogin ? formatDateTime(profile.lastLogin) : 'Never'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Member since: {formatDateTime(profile.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(profile.isActive)}
                </div>
              </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </div>
   );
}

