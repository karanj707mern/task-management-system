'use client';

import { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority, Comment, WorkLog } from '@/types';
import { Calendar, Flag, User, Clock, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { commentService } from '@/services/comments.service';
import { taskService } from '@/services/tasks.service';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  isAdmin: boolean;
}

export function TaskDetailModal({ task, isOpen, onClose, onUpdate, isAdmin }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', status: 'TODO' as TaskStatus, priority: 'MEDIUM' as TaskPriority });
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [newWorkLog, setNewWorkLog] = useState({ hours: '', description: '' });
  const [submittingWorkLog, setSubmittingWorkLog] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Sync form state when task/id changes */
  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
      });
      setIsEditing(false);
      if (isOpen) {
        commentService.getByTaskId(task.id, 1, 50).then((res) => setComments(res.data));
        taskService.getById(task.id).then((fullTask) => {
          setWorkLogs(fullTask.workLogs || []);
        });
      }
    }
  }, [task, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, editData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await commentService.create({ content: newComment.trim(), taskId: task.id });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {
      setComments((prev) => prev);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentService.delete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleAddWorkLog = async () => {
    if (!task || !newWorkLog.hours) return;
    setSubmittingWorkLog(true);
    try {
      await taskService.createWorkLog(task.id, parseFloat(newWorkLog.hours), newWorkLog.description || undefined);
      setNewWorkLog({ hours: '', description: '' });
      const fullTask = await taskService.getById(task.id);
      setWorkLogs(fullTask.workLogs || []);
      onUpdate(task.id, {});
    } catch {
      setWorkLogs((prev) => prev);
    } finally {
      setSubmittingWorkLog(false);
    }
  };

  const priorityColors: Record<TaskPriority, string> = {
    LOW: 'text-emerald-600',
    MEDIUM: 'text-amber-600',
    HIGH: 'text-orange-600',
    URGENT: 'text-red-600',
  };

  const statusStyles: Record<string, string> = {
    TODO: 'bg-muted text-muted-foreground',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    DONE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    CANCELLED: 'bg-muted text-muted-foreground',
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-full sm:max-w-lg w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] sm:h-auto sm:w-auto sm:max-w-[calc(100vw-4rem)] sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : task.title}</DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={editData.title} onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" value={editData.description} onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={editData.status} onValueChange={(val) => setEditData((prev) => ({ ...prev, status: val as TaskStatus }))}>
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
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={editData.priority} onValueChange={(val) => setEditData((prev) => ({ ...prev, priority: val as TaskPriority }))}>
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
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">
                Comments {comments.length > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{comments.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="worklogs">
                Time Log {workLogs.length > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{workLogs.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="subtasks">
                Subtasks {task.subTasks && task.subTasks.length > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{task.subTasks.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              {task.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm text-foreground mt-1">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={statusStyles[task.status] || statusStyles.TODO}>
                      {TASK_STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Flag className={`h-4 w-4 ${priorityColors[task.priority]}`} />
                    <span className="text-sm font-medium text-foreground">
                      {TASK_PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label || task.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Project</Label>
                  <p className="text-sm font-medium text-foreground mt-1">{task.project?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assignee</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{task.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {task.tags && task.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {(task.estimatedHours || task.actualHours) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Hours</Label>
                    <p className="text-sm text-foreground mt-1">{task.estimatedHours || 0}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Actual Hours</Label>
                    <p className="text-sm text-foreground mt-1">{task.actualHours || 0}h</p>
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Due Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-sm text-foreground mt-1">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Updated</Label>
                  <p className="text-sm text-foreground mt-1">{new Date(task.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {task.parentTask && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1">Parent Task</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 rounded-md border border-border bg-muted/30">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{task.parentTask.title}</span>
                  </div>
                </div>
              )}

              {task.subTasks && task.subTasks.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2">Subtasks</Label>
                  <div className="space-y-2">
                    {task.subTasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{sub.title}</span>
                        <Badge variant="secondary" className={`ml-auto text-xs ${statusStyles[sub.status] || ''}`}>{sub.status.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 py-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                            {comment.author?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{comment.author?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-2">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="min-h-[60px]"
                />
                <Button size="sm" onClick={handleAddComment} disabled={submittingComment || !newComment.trim()} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="worklogs" className="space-y-4 py-4">
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {workLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No time logged</p>
                ) : (
                  workLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{log.hours}h</span>
                        {log.description && <span className="text-xs text-muted-foreground">— {log.description}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Hours (e.g. 2.5)"
                  value={newWorkLog.hours}
                  onChange={(e) => setNewWorkLog((prev) => ({ ...prev, hours: e.target.value }))}
                  className="w-24"
                  type="number"
                  step="0.5"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newWorkLog.description}
                  onChange={(e) => setNewWorkLog((prev) => ({ ...prev, description: e.target.value }))}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddWorkLog} disabled={submittingWorkLog || !newWorkLog.hours} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subtasks" className="py-4">
              {!task.subTasks || task.subTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No subtasks</p>
              ) : (
                <div className="space-y-2">
                  {task.subTasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sub.title}</p>
                      </div>
                      <Badge variant="secondary" className={`text-xs ${statusStyles[sub.status] || ''}`}>{sub.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              {isAdmin && <Button onClick={() => setIsEditing(true)}>Edit</Button>}
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
