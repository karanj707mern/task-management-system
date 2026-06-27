'use client';

import { cn, formatDate, getStatusColor } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Calendar, Flag, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priorityColors: Record<TaskPriority, string> = {
    LOW: 'text-emerald-500',
    MEDIUM: 'text-amber-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-500',
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'DONE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'group bg-card rounded-lg border border-border p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-primary rotate-2 opacity-80',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-medium text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h4>
        <span className={cn('flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full', getStatusColor(task.status))}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
              {task.assignee.name?.charAt(0).toUpperCase() || '?'}
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">?</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">{task.assignee?.name || 'Unassigned'}</span>
        </div>

        <div className="flex items-center gap-1">
          {task.tags && task.tags.length > 0 && (
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Flag className={cn('h-3.5 w-3.5', priorityColors[task.priority])} />
        </div>
      </div>

      {dueDate && (
        <div className="flex items-center gap-1.5 mt-3 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {formatDate(dueDate)}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>
      )}

      {task.project && (
        <div className="mt-2 text-xs text-muted-foreground">
          {task.project.name}
        </div>
      )}
    </motion.div>
  );
}