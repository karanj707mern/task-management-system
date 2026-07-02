'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { commitService } from '@/services/commits.service';
import { branchService } from '@/services/branches.service';
import { isAdministrator, isManagerOrAbove, type Commit, type Branch } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Trash2, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommitsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    branchId: '',
    sha: '',
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdministrator(user?.role);
  const canCreateCommit = isManagerOrAbove(user?.role);

  const loadCommits = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const response = await commitService.getAll();
      setCommits(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setPageLoading(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const response = await branchService.getAll();
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  /* eslint-disable react-hooks/set-state-in-effect -- Data loading on auth change uses async loaders */
  useEffect(() => {
    if (isAuthenticated) {
      loadCommits();
      loadBranches();
    }
  }, [isAuthenticated, loadCommits, loadBranches]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreate = () => {
    setFormData({ message: '', branchId: '', sha: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.message.trim() || !formData.branchId || !formData.sha.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await commitService.create({
        message: formData.message.trim(),
        branchId: formData.branchId,
        sha: formData.sha.trim(),
      });
      setCommits((prev) => [created, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commitId: string) => {
    if (!confirm('Delete this commit?')) return;
    setError(null);
    try {
      await commitService.delete(commitId);
      setCommits((prev) => prev.filter((c) => c.id !== commitId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const truncateSha = (sha: string) => {
    return sha.length > 10 ? `${sha.substring(0, 7)}...` : sha;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Commits</h1>
              <p className="mt-1 text-base text-muted-foreground">Track code commits across branches.</p>
            </div>
            {canCreateCommit && (
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="h-5 w-5" />
                New Commit
              </Button>
            )}
          </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadCommits}>Retry</Button>
            </CardContent>
          </Card>
        )}

        {pageLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-card/80 backdrop-blur rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">SHA</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Message</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Task</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Created At</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {commits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No commits yet. Create one to start tracking code changes.
                      </td>
                    </tr>
                  )}
                  {commits.map((commit) => (
                    <tr key={commit.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3 font-mono text-base">
                        <div className="flex items-center gap-2">
                          <GitCommit className="h-5 w-5 text-muted-foreground" />
                          <span>{truncateSha(commit.sha)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base max-w-xs truncate">
                        {commit.message}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {branches.find(b => b.id === commit.branchId)?.name || 'Unknown branch'}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {commit.authorId || 'Unknown author'}
                      </td>
                      <td className="px-4 py-3 text-base">
                        -
                      </td>
                      <td className="px-4 py-3 text-base text-muted-foreground">
                        {new Date(commit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(commit.id)} aria-label="Delete commit">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>Create Commit</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="commit-sha">SHA</Label>
                <Input id="commit-sha" value={formData.sha} onChange={(e) => setFormData((prev) => ({ ...prev, sha: e.target.value }))} placeholder="Commit SHA (e.g., a1b2c3d4)" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commit-branch">Branch</Label>
                <Select value={formData.branchId} onValueChange={(val) => setFormData((prev) => ({ ...prev, branchId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commit-message">Message</Label>
                <Textarea id="commit-message" value={formData.message} onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))} placeholder="Commit message" rows={3} required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Create Commit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}