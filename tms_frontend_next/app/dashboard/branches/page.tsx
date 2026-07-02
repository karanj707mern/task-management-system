'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { branchService } from '@/services/branches.service';
import { taskService } from '@/services/tasks.service';
import { sprintService } from '@/services/sprints.service';
import { isAdministrator, isManagerOrAbove, type Branch, type Sprint, type Task } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Pencil, Trash2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function BranchesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taskId: '',
    sprintId: '',
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdministrator(user?.role);
  const canEditBranch = isManagerOrAbove(user?.role);

  const loadBranches = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const response = await branchService.getAll();
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setPageLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tasksData, sprintsData] = await Promise.all([
        taskService.getAll(),
        sprintService.getAll(),
      ]);
      setTasks(Array.isArray(tasksData.data) ? tasksData.data : []);
      setSprints(Array.isArray(sprintsData.data) ? sprintsData.data : []);
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
      loadBranches();
      loadData();
    }
  }, [isAuthenticated, loadBranches, loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreate = () => {
    setEditingBranch(null);
    setFormData({ name: '', taskId: '', sprintId: '' });
    setShowForm(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      taskId: branch.taskId,
      sprintId: branch.sprintId || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.taskId) return;
    setSaving(true);
    setError(null);
    try {
      if (editingBranch) {
        const updated = await branchService.update(editingBranch.id, {
          name: formData.name.trim(),
          taskId: formData.taskId,
          sprintId: formData.sprintId || undefined,
        });
        setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const created = await branchService.create({
          name: formData.name.trim(),
          taskId: formData.taskId,
          sprintId: formData.sprintId || undefined,
        });
        setBranches((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingBranch(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Delete this branch?')) return;
    setError(null);
    try {
      await branchService.delete(branchId);
      setBranches((prev) => prev.filter((b) => b.id !== branchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Branches</h1>
              <p className="mt-1 text-base text-muted-foreground">Track code branches linked to tasks.</p>
            </div>
            {canEditBranch && (
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="h-5 w-5" />
                New Branch
              </Button>
            )}
          </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadBranches}>Retry</Button>
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
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Task</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Sprint</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground">Created At</th>
                    <th className="px-4 py-3 text-base font-medium text-muted-foreground w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No branches yet. Create one to start tracking code.
                      </td>
                    </tr>
                  )}
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{branch.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base">
                        {tasks.find(t => t.id === branch.taskId)?.title || 'Unknown task'}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {sprints.find(s => s.id === branch.sprintId)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {branch.authorId || 'Unknown author'}
                      </td>
                      <td className="px-4 py-3 text-base text-muted-foreground">
                        {new Date(branch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {canEditBranch && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(branch)} aria-label="Edit branch">
                              <Pencil className="h-5 w-5" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(branch.id)} aria-label="Delete branch">
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
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
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branch-name">Branch name</Label>
                <Input id="branch-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Branch name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-task">Task</Label>
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
              <div className="space-y-2">
                <Label htmlFor="branch-sprint">Sprint (optional)</Label>
                <Select value={formData.sprintId} onValueChange={(val) => setFormData((prev) => ({ ...prev, sprintId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No sprint</SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}