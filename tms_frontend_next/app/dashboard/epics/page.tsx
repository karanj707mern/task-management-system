'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { epicService } from '@/services/epics.service';
import { projectService } from '@/services/projects.service';
import { isAdministrator, isManagerOrAbove, type Epic, type Project, type EpicStatus } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const EPIC_STATUS_OPTIONS: { value: EpicStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const EPIC_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4',
];

export default function EpicsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [epics, setEpics] = useState<Epic[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    color: EPIC_COLORS[0],
    status: 'PLANNING' as EpicStatus,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdministrator(user?.role);
  const canEditEpic = isManagerOrAbove(user?.role);

  const loadEpics = useCallback(async () => {
    setError(null);
    try {
      const response = await epicService.getAll();
      setEpics(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await projectService.getAll();
      setProjects(Array.isArray(response?.data) ? response.data : []);
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
      loadEpics();
      loadProjects();
    }
  }, [isAuthenticated, loadEpics, loadProjects]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCreate = () => {
    setEditingEpic(null);
    setFormData({ name: '', description: '', projectId: '', color: EPIC_COLORS[0], status: 'PLANNING' });
    setShowForm(true);
  };

  const openEdit = (epic: Epic) => {
    setEditingEpic(epic);
    setFormData({
      name: epic.name,
      description: epic.description || '',
      projectId: epic.projectId,
      color: epic.color || EPIC_COLORS[0],
      status: epic.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.projectId) return;
    setSaving(true);
    setError(null);
    try {
      if (editingEpic) {
        const updated = await epicService.update(editingEpic.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          projectId: formData.projectId,
          color: formData.color,
          status: formData.status,
        });
        setEpics((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await epicService.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          projectId: formData.projectId,
          color: formData.color,
          status: formData.status,
        });
        setEpics((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingEpic(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (epicId: string) => {
    if (!confirm('Delete this epic? All associated tasks will be unlinked.')) return;
    setError(null);
    try {
      await epicService.delete(epicId);
      setEpics((prev) => prev.filter((e) => e.id !== epicId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const getStatusBadgeClass = (status: EpicStatus) => {
    const styles: Record<EpicStatus, string> = {
      PLANNING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      ARCHIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Epics</h1>
            <p className="mt-1 text-base text-muted-foreground">Manage large features across projects.</p>
          </div>
          {canEditEpic && (
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-5 w-5" />
              New Epic
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadEpics}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {epics.length === 0 && !error && (
            <Card className="col-span-full border-dashed">
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                No epics yet. Create one to start organizing features.
              </CardContent>
            </Card>
          )}
          {epics.map((epic) => (
            <Card key={epic.id} className="border-border/60 bg-card/80 backdrop-blur overflow-hidden">
              <div className="h-1" style={{ backgroundColor: epic.color || EPIC_COLORS[0] }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold truncate">{epic.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {epic.description || 'No description yet'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className={getStatusBadgeClass(epic.status)}>
                    {epic.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-base text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-5 w-5" />
                    {epic.project?.name || 'Unknown project'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>
                    {(epic._count?.tasks ?? 0)} tasks • {(epic._count?.sprints ?? 0)} sprints
                  </span>
                  <span>Created {new Date(epic.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {canEditEpic && (
                    <>
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(epic)} aria-label="Edit epic">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(epic.id)} aria-label="Delete epic">
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
              <DialogTitle>{editingEpic ? 'Edit Epic' : 'Create Epic'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="epic-name" className="text-base font-medium">Epic name</Label>
                <Input id="epic-name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Epic name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="epic-description" className="text-base font-medium">Description</Label>
                <Textarea id="epic-description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Epic description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="epic-project" className="text-base font-medium">Project</Label>
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
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="epic-status" className="text-base font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as EpicStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EPIC_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epic-color" className="text-base font-medium">Color</Label>
                  <Select value={formData.color} onValueChange={(val) => setFormData((prev) => ({ ...prev, color: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EPIC_COLORS.map((c) => (
                        <SelectItem key={c} value={c}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                            <span>{c}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingEpic ? 'Save Changes' : 'Create Epic'}
               </Button>
             </div>
           </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }
