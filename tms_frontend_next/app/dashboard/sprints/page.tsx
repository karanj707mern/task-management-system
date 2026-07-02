'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { sprintService } from '@/services/sprints.service';
import { projectService } from '@/services/projects.service';
import { epicService } from '@/services/epics.service';
import { isAdministrator, isManagerOrAbove, type Sprint, type Project, type Epic, type SprintStatus } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const SPRINT_STATUS_OPTIONS: { value: SprintStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function SprintsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    projectId: '',
    epicId: '',
    status: 'PLANNING' as SprintStatus,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdministrator(user?.role);
  const canEditSprint = isManagerOrAbove(user?.role);

  const loadSprints = useCallback(async () => {
    setError(null);
    try {
      const response = await sprintService.getAll();
      setSprints(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [projectsData, epicsData] = await Promise.all([
        projectService.getAll(),
        epicService.getAll(),
      ]);
      setProjects(Array.isArray(projectsData?.data) ? projectsData.data : []);
      setEpics(Array.isArray(epicsData?.data) ? epicsData.data : []);
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
      loadSprints();
      loadData();
    }
  }, [isAuthenticated, loadSprints, loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreate = () => {
    setEditingSprint(null);
    setFormData({ name: '', goal: '', projectId: '', epicId: '', status: 'PLANNING' });
    setShowForm(true);
  };

  const openEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormData({
      name: sprint.name,
      goal: sprint.goal || '',
      projectId: sprint.projectId,
      epicId: sprint.epicId || '',
      status: sprint.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.projectId) return;
    setSaving(true);
    setError(null);
    try {
      if (editingSprint) {
        const updated = await sprintService.update(editingSprint.id, {
          name: formData.name.trim(),
          goal: formData.goal.trim() || undefined,
          epicId: formData.epicId || undefined,
          status: formData.status,
        });
        setSprints((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await sprintService.create({
          name: formData.name.trim(),
          goal: formData.goal.trim() || undefined,
          projectId: formData.projectId,
          epicId: formData.epicId || undefined,
          status: formData.status,
        });
        setSprints((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingSprint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sprintId: string) => {
    if (!confirm('Delete this sprint? Tasks in the sprint will be unassigned.')) return;
    setError(null);
    try {
      await sprintService.delete(sprintId);
      setSprints((prev) => prev.filter((s) => s.id !== sprintId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const getStatusBadgeClass = (status: SprintStatus) => {
    const styles: Record<SprintStatus, string> = {
      PLANNING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
    return styles[status];
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Sprints</h1>
            <p className="mt-1 text-base text-muted-foreground">Plan and track sprint iterations.</p>
          </div>
          {canEditSprint && (
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-5 w-5" />
              New Sprint
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadSprints}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sprints.length === 0 && !error && (
            <Card className="col-span-full border-dashed">
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                No sprints yet. Create one to start planning iterations.
              </CardContent>
            </Card>
          )}
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="border-border/60 bg-card/80 backdrop-blur overflow-hidden">
               <div className="h-1 bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold truncate">{sprint.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {sprint.goal || 'No goal defined'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className={getStatusBadgeClass(sprint.status)}>
                    {sprint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-base text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Target className="h-5 w-5" />
                    {sprint.project?.name || 'Unknown project'}
                  </span>
                  {sprint.epic && (
                    <span className="flex items-center gap-1 text-base">
                      {sprint.epic.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>
                    {sprint._count?.tasks ?? 0} tasks
                  </span>
                  <span>Created {new Date(sprint.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {canEditSprint && (
                    <>
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(sprint)} aria-label="Edit sprint">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(sprint.id)} aria-label="Delete sprint">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-name">Sprint name</Label>
                <Input id="sprint-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Sprint name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-goal">Goal</Label>
                <Textarea id="sprint-goal" value={formData.goal} onChange={(e) => setFormData((prev) => ({ ...prev, goal: e.target.value }))} placeholder="Sprint goal" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-project">Project</Label>
                <Select value={formData.projectId} onValueChange={(val) => setFormData((prev) => ({ ...prev, projectId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-epic">Epic (optional)</Label>
                <Select value={formData.epicId} onValueChange={(val) => setFormData((prev) => ({ ...prev, epicId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No epic</SelectItem>
                    {epics.filter((e) => !formData.projectId || e.projectId === formData.projectId).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-status">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as SprintStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPRINT_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingSprint ? 'Save Changes' : 'Create Sprint'}
              </Button>
             </div>
           </DialogContent>
          </Dialog>
        </div>
      </div>
    );
}