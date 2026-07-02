'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/tasks.service';
import { projectService } from '@/services/projects.service';
import { userService } from '@/services/users.service';
import { isAdministrator, isManagerOrAbove, type Task, type TaskStatus, type Project, type User, type TaskPriority } from '@/types';
import { ROUTES, ERROR_MESSAGES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/constants';
import { Plus, Search, Flag, Calendar, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskBoard } from '@/components/ui/TaskBoard';
import { TaskDetailModal } from '@/components/ui/TaskDetailModal';
import { cn } from '@/lib/utils';

const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-sky-500 dark:bg-sky-400',
  IN_PROGRESS: 'bg-blue-500 dark:bg-blue-400',
  IN_REVIEW: 'bg-amber-500 dark:bg-amber-400',
  DONE: 'bg-emerald-500 dark:bg-emerald-400',
  BLOCKED: 'bg-rose-500 dark:bg-rose-400',
  CANCELLED: 'bg-slate-500 dark:bg-slate-400',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  URGENT: 'text-red-600 dark:text-red-400',
};

export default function TasksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'TODO' as TaskStatus,
    dueDate: '',
    estimatedHours: '',
  });

  const role = user?.role;
  const isAdmin = isAdministrator(role);
  const canCreateTask = isManagerOrAbove(role);
  const canUpdateOwnTask = (task: Task) => role === 'EMPLOYEE' && task.assigneeId === user?.id;
  const canEditTask = (task: Task) => isAdmin || isManagerOrAbove(role) || canUpdateOwnTask(task);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const task = await taskService.create({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        projectId: formData.projectId,
        assigneeId: formData.assigneeId,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      });
      setAllTasks((prev) => [task, ...prev]);
      setFormData({ title: '', description: '', projectId: '', assigneeId: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', estimatedHours: '' });
      setShowCreate(false);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setCreating(false);
    }
  }


  const loadProjects = useCallback(async () => {
    try {
      const response = await projectService.getAll({ limit: 100 });
      setProjects(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll({ limit: 100 });
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const response = await taskService.getAll();
      setAllTasks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
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
      loadUsers();
    }
  }, [isAuthenticated, loadProjects, loadUsers]);


  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated, loadTasks]);

  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project?.name.toLowerCase().includes(query),
      );
    }
    return result;
  }, [allTasks, searchQuery]);

  const getStatusBadgeClass = (status: TaskStatus) => {
    const styles: Record<TaskStatus, string> = {
      TODO: 'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700',
      IN_REVIEW: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
      DONE: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
      BLOCKED: 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700',
      CANCELLED: 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-600',
    };
    return styles[status];
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const updated = await taskService.updateStatus(taskId, status);
      setAllTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      const updated = await taskService.update(taskId, data);
      setAllTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      setSelectedTask(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  if (isLoading) {
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
    <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
              <p className="text-base text-muted-foreground mt-1">Manage and track project tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'board' ? 'list' : 'board')}
                className="gap-2"
              >
                {view === 'board' ? 'List View' : 'Board View'}
              </Button>
              {canCreateTask && (
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-5 w-5" />
                      New Task
                    </Button>
                  </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('[role="listbox"]') || target.closest('[role="option"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                  e.preventDefault();
                }
              }}>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    label="Task title"
                    placeholder="Task title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Description</Label>
                    <Textarea
                      placeholder="Task description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Status</Label>
                      <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as TaskStatus }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Priority</Label>
                      <Select value={formData.priority} onValueChange={(val) => setFormData((prev) => ({ ...prev, priority: val as TaskPriority }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_PRIORITY_OPTIONS.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Project</Label>
                      <Select value={formData.projectId} onValueChange={(val) => setFormData((prev) => ({ ...prev, projectId: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Assignee</Label>
                      <Select value={formData.assigneeId} onValueChange={(val) => setFormData((prev) => ({ ...prev, assigneeId: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Due Date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                    <Input
                      label="Estimated Hours"
                      type="text"
                      placeholder="0"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estimatedHours: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
              )}
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadTasks}>Retry</Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-base font-medium text-muted-foreground">Project</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {TASK_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-1">
                 <Label className="text-base font-medium text-muted-foreground">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    {TASK_PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-1">
                 <Label className="text-base font-medium text-muted-foreground">Assignee</Label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All assignees</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {view === 'board' ? (
          <TaskBoard
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onStatusChange={handleUpdateStatus}
          />
        ) : (
          <div className="grid gap-3 sm:hidden">
            {filteredTasks.length === 0 ? (
              <Card className="border-border/60 bg-card/80">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No tasks found
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="border-border/60 bg-card/80 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setSelectedTask(task)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-foreground line-clamp-1">{task.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT_COLORS[task.status])} />
                        <span className="text-xs text-muted-foreground">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <Flag className={cn('h-3.5 w-3.5', PRIORITY_COLORS[task.priority])} />
                          <span className="text-muted-foreground">{task.priority}</span>
                        </span>
                        {task.project && (
                          <span className="text-muted-foreground truncate">{task.project.name}</span>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Desktop table view */}
        {view === 'list' && (
          <div className="hidden sm:block">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-3 font-medium text-muted-foreground">Task</th>
                        <th className="p-3 font-medium text-muted-foreground">Status</th>
                        <th className="p-3 font-medium text-muted-foreground">Priority</th>
                        <th className="p-3 font-medium text-muted-foreground">Project</th>
                        <th className="p-3 font-medium text-muted-foreground">Assignee</th>
                        <th className="p-3 font-medium text-muted-foreground">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No tasks found
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((task) => (
                          <tr
                            key={task.id}
                            className="border-b border-border/60 hover:bg-muted/40 cursor-pointer transition-colors"
                            onClick={() => setSelectedTask(task)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTask(task); } }}
                          >
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-foreground truncate max-w-[200px]">{task.title}</p>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{task.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT_COLORS[task.status])} />
                                <span className="text-sm text-foreground">{task.status.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="flex items-center gap-1.5">
                                <Flag className={cn('h-3.5 w-3.5', PRIORITY_COLORS[task.priority])} />
                                <span className="text-foreground">{task.priority}</span>
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">{task.project?.name || '—'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {task.assignee ? (
                                  <>
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                      {task.assignee.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-foreground text-sm">{task.assignee.name}</span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
         onUpdate={handleUpdateTask}
         canEdit={selectedTask ? canEditTask(selectedTask) : false}
         />
        </div>
        </div>
    );
}


