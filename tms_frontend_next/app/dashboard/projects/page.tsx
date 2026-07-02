'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/projects.service';
import { Project } from '@/types';
import { ROUTES, ERROR_MESSAGES } from '@/constants';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdministrator, isManagerOrAbove } from '@/types';

export default function ProjectsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdministrator(user?.role);
  const canEditProject = isManagerOrAbove(user?.role);

  const loadProjects = useCallback(async () => {
    setPageLoading(true);
    setError(null);
    try {
      const response = await projectService.getAll();
      setProjects(response?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, loadProjects]);

  const openCreate = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingProject) {
        const updated = await projectService.update(editingProject.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
      } else {
        const created = await projectService.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        setProjects((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project? Tasks in the project will also be deleted.')) return;
    setError(null);
    try {
      await projectService.delete(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  if (isLoading || pageLoading) {
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="mt-1 text-base text-muted-foreground">Create, edit, and organize project workspaces.</p>
          </div>
          {isAdmin && (
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-5 w-5" />
              New Project
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadProjects}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.length === 0 && !error && (
            <Card className="col-span-full border-dashed">
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                No projects yet. Create one to start tracking work.
              </CardContent>
            </Card>
          )}
          {projects.map((project) => (
            <Card key={project.id} className="border-border/60 bg-card/80 backdrop-blur overflow-hidden">
               <div className="h-1 bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description || 'No description yet'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {project.status || 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-base text-muted-foreground">
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    {canEditProject && (
                      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(project)} aria-label="Edit project">
                        <Pencil className="h-5 w-5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive" onClick={() => handleDelete(project.id)} aria-label="Delete project">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>

       <Dialog open={showForm} onOpenChange={setShowForm}>
             <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
               const target = e.target as HTMLElement;
               if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                 e.preventDefault();
               }
             }}>
              <DialogHeader>
                <DialogTitle>{editingProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
              </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="project-name" className="text-base font-medium">Project name</Label>
               <Input
                 id="project-name"
                 value={formData.name}
                 onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                 placeholder="Project name"
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="project-description" className="text-base font-medium">Description</Label>
              <Textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </DialogContent>
       </Dialog>
     </div>
   );
}
