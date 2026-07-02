'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/tasks.service';
import { dashboardService } from '@/services/dashboard.service';
import { ROUTES } from '@/constants';
import { isAdministrator, type Task, type TaskStatus, type TaskPriority, type UserRole } from '@/types';
import { Clock, CheckCircle, AlertCircle, Bell, Trash2, ArrowRight, RefreshCw, Sparkles, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = (user?.role as UserRole) || 'EMPLOYEE';
  const isAdmin = isAdministrator(role);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the dedicated dashboard stats endpoint for aggregated data
      const statsData = await dashboardService.getStats();
      setStats({
        total: statsData.totalTasks,
        completed: statsData.tasksByStatus['DONE'] || 0,
        inProgress: statsData.tasksByStatus['IN_PROGRESS'] || 0,
        overdue: statsData.overdueCount,
      });

      // Fetch recent tasks from task service for activity feed
      const response = await taskService.getAll({ limit: 50 });
      const tasks = response.data;
      const sorted = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentTasks(sorted.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      loadDashboard();
    } catch {
      // Task deletion failed - state unchanged
    }
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    const styles: Record<TaskStatus, string> = {
      TODO: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      IN_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      DONE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      BLOCKED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      CANCELLED: 'bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200',
    };
    return styles[status];
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      LOW: 'text-emerald-600 dark:text-emerald-400',
      MEDIUM: 'text-amber-600 dark:text-amber-400',
      HIGH: 'text-orange-600 dark:text-orange-400',
      URGENT: 'text-red-600 dark:text-red-400',
    };
    return <AlertCircle className={`h-4 w-4 ${colors[priority]}`} />;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-blue-50/70 p-5 sm:p-6 shadow-sm dark:to-blue-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">
                <Sparkles className="h-4 w-4" />
                Welcome back
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Hello, {user?.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Stay on top of your work with a concise view of priorities, progress, and what needs attention.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadDashboard} className="gap-2 self-start">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 flex items-center justify-between">
               <p className="text-base text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadDashboard}>Retry</Button>
            </CardContent>
          </Card>
        )}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
            { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
            { label: 'Overdue', value: stats.overdue, icon: Bell, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border/60 bg-card/80 backdrop-blur">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-xl ${stat.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">Recent Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">Your latest activity and upcoming work in one place.</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 self-start" asChild>
              <Link href={ROUTES.TASKS}>
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
                <Layers3 className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-base font-medium text-foreground">Nothing is on your plate yet</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">Create a project, assign work, and this view will fill with your most recent tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {getPriorityIcon(task.priority)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {task.project?.name || 'Unknown project'} • {task.assignee?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-3 pl-2 sm:pl-0">
                        <Badge variant="secondary" className={`${getStatusBadgeClass(task.status)} text-sm`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => {
                            if (confirm('Delete this task?')) deleteTask(task.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
