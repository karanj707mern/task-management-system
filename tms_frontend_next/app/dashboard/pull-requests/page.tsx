'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ERROR_MESSAGES, ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { pullRequestService } from '@/services/pull-requests.service';
import { taskService } from '@/services/tasks.service';
import { userService } from '@/services/users.service';
import { isManagerOrAbove as hasManagerAccess, type PRStatus, type PullRequest, type Task, type User } from '@/types';
import { GitPullRequest, Merge, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const PR_STATUS_OPTIONS: { value: PRStatus; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Open', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'IN_REVIEW', label: 'In Review', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'CHANGES_REQUESTED', label: 'Changes Requested', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'MERGED', label: 'Merged', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-muted text-muted-foreground border-border' },
];

export default function PullRequestsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPR, setEditingPR] = useState<PullRequest | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskId: '',
    sourceBranch: '',
    targetBranch: '',
    reviewerId: '',
    status: '' as PRStatus | '',
  });
  const [saving, setSaving] = useState(false);

  const isManagerOrAbove = hasManagerAccess(user?.role);

  const loadPRs = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (taskFilter !== 'all') filters.taskId = taskFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const response = await pullRequestService.getAll(filters);
      setPrs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setPageLoading(false);
    }
  }, [taskFilter, statusFilter]);

  const loadTasks = useCallback(async () => {
    try {
      const response = await taskService.getAll({ limit: 100 });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch {
      // silently fail
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll({ limit: 100 });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);


  useEffect(() => {
    if (isAuthenticated) {
      loadPRs();
      loadTasks();
      loadUsers();
    }
  }, [isAuthenticated, loadPRs, loadTasks, loadUsers]);


  const filteredPRs = prs.filter((pr) => {
    if (taskFilter !== 'all' && pr.taskId !== taskFilter) return false;
    if (statusFilter !== 'all' && pr.status !== statusFilter) return false;
    return true;
  });

  const openCreate = () => {
    setEditingPR(null);
    setFormData({ title: '', description: '', taskId: taskFilter !== 'all' ? taskFilter : '', sourceBranch: '', targetBranch: '', reviewerId: '', status: '' });
    setShowForm(true);
  };

  const openEdit = (pr: PullRequest) => {
    setEditingPR(pr);
    setFormData({
      title: pr.title,
      description: pr.description || '',
      taskId: pr.taskId,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      reviewerId: pr.reviewerId || '',
      status: pr.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.taskId || !formData.sourceBranch.trim() || !formData.targetBranch.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingPR) {
        const payload: { status?: PRStatus; reviewerId?: string } = {};
        if (formData.status) {
          payload.status = formData.status;
        }
        if (formData.reviewerId) {
          payload.reviewerId = formData.reviewerId;
        }
        const updated = await pullRequestService.update(editingPR.id, payload);
        setPrs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const payload: { title: string; description?: string; taskId: string; sourceBranch: string; targetBranch: string; reviewerId?: string } = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          taskId: formData.taskId,
          sourceBranch: formData.sourceBranch.trim(),
          targetBranch: formData.targetBranch.trim(),
        };
        if (formData.reviewerId) {
          payload.reviewerId = formData.reviewerId;
        }
        const created = await pullRequestService.create(payload);
        setPrs((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingPR(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignReviewer = async (pr: PullRequest, reviewerId: string) => {
    if (!reviewerId) return;
    setError(null);
    try {
      const updated = await pullRequestService.assignReviewer(pr.id, reviewerId);
      setPrs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const handleMerge = async (prId: string) => {
    if (!confirm('Merge this pull request? This action cannot be undone.')) return;
    setMergingId(prId);
    setError(null);
    try {
      const updated = await pullRequestService.merge(prId);
      setPrs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setMergingId(null);
    }
  };

  const handleDelete = async (prId: string) => {
    if (!confirm('Delete this pull request? This action cannot be undone.')) return;
    setError(null);
    try {
      await pullRequestService.delete(prId);
      setPrs((prev) => prev.filter((p) => p.id !== prId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const getStatusBadge = (status: PRStatus) => {
    const option = PR_STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return <Badge variant="outline">{status}</Badge>;
    return <Badge className={option.color} variant="outline">{option.label}</Badge>;
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Pull Requests</h1>
            <p className="mt-1 text-base text-muted-foreground">Manage pull requests linked to tasks and branches.</p>
          </div>
          {isManagerOrAbove && (
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-5 w-5" />
            New Pull Request
          </Button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PR_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadPRs}>Retry</Button>
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
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Task</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Target</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Reviewer</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground w-48"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPRs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No pull requests found. {isManagerOrAbove ? 'Create one to get started.' : ''}
                      </td>
                    </tr>
                  )}
                  {filteredPRs.map((pr) => (
                    <tr key={pr.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GitPullRequest className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{pr.title}</span>
                        </div>
                        {pr.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-[300px] truncate">{pr.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-base">
                        <span
                          className="cursor-pointer text-primary hover:underline"
                          onClick={() => router.push(`${ROUTES.TASKS}`)}
                        >
                          {pr.task?.title || tasks.find((t) => t.id === pr.taskId)?.title || 'Unknown task'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base">{getStatusBadge(pr.status)}</td>
                      <td className="px-4 py-3 text-base">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{pr.sourceBranch}</code>
                      </td>
                      <td className="px-4 py-3 text-base">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{pr.targetBranch}</code>
                      </td>
                      <td className="px-4 py-3 text-base">
                        {pr.author?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {pr.reviewer?.name || (
                          isManagerOrAbove ? (
                            <Select
                              value={pr.reviewerId || ''}
                              onValueChange={(val) => handleAssignReviewer(pr, val)}
                            >
                              <SelectTrigger className="h-10 w-[140px]">
                                <SelectValue placeholder="Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {users
                                  .filter((u) => u.id !== pr.authorId)
                                  .map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isManagerOrAbove && pr.status !== 'MERGED' && pr.status !== 'CLOSED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => openEdit(pr)}
                              title="Edit"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                          )}
                          {isManagerOrAbove && (pr.status === 'OPEN' || pr.status === 'IN_REVIEW') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleMerge(pr.id)}
                              disabled={mergingId === pr.id}
                              title="Merge"
                            >
                              <Merge className="h-5 w-5" />
                            </Button>
                          )}
                          {isManagerOrAbove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(pr.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[550px]" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>{editingPR ? 'Edit Pull Request' : 'Create Pull Request'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pr-title">Title</Label>
                <Input
                  id="pr-title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="PR title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-description">Description</Label>
                <Input
                  id="pr-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the changes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-task">Task *</Label>
                <Select value={formData.taskId} onValueChange={(val) => setFormData((prev) => ({ ...prev, taskId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pr-source">Source Branch *</Label>
                  <Input
                    id="pr-source"
                    value={formData.sourceBranch}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sourceBranch: e.target.value }))}
                    placeholder="feature/xyz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pr-target">Target Branch *</Label>
                  <Input
                    id="pr-target"
                    value={formData.targetBranch}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetBranch: e.target.value }))}
                    placeholder="main"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-reviewer">Reviewer</Label>
                <Select value={formData.reviewerId} onValueChange={(val) => setFormData((prev) => ({ ...prev, reviewerId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No reviewer</SelectItem>
                    {users
                      .filter((u) => u.isActive)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {editingPR && (
                <div className="space-y-2">
                  <Label htmlFor="pr-status">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as PRStatus }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PR_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingPR ? 'Save Changes' : 'Create Pull Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
