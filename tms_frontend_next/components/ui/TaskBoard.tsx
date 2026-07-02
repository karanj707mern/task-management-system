'use client';

import { useCallback, useMemo, useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-sky-500 dark:bg-sky-400',
  IN_PROGRESS: 'bg-blue-500 dark:bg-blue-400',
  IN_REVIEW: 'bg-amber-500 dark:bg-amber-400',
  DONE: 'bg-emerald-500 dark:bg-emerald-400',
  BLOCKED: 'bg-rose-500 dark:bg-rose-400',
  CANCELLED: 'bg-slate-500 dark:bg-slate-400',
};

const STATUS_BG_COLORS: Record<TaskStatus, { bg: string; border: string }> = {
  TODO: { bg: 'bg-sky-50/80 dark:bg-sky-950/20', border: 'border-sky-200/50 dark:border-sky-800/30' },
  IN_PROGRESS: { bg: 'bg-blue-50/80 dark:bg-blue-950/20', border: 'border-blue-200/50 dark:border-blue-800/30' },
  IN_REVIEW: { bg: 'bg-amber-50/80 dark:bg-amber-950/20', border: 'border-amber-200/50 dark:border-amber-800/30' },
  DONE: { bg: 'bg-emerald-50/80 dark:bg-emerald-950/20', border: 'border-emerald-200/50 dark:border-emerald-800/30' },
  BLOCKED: { bg: 'bg-rose-50/80 dark:bg-rose-950/20', border: 'border-rose-200/50 dark:border-rose-800/30' },
  CANCELLED: { bg: 'bg-slate-50/80 dark:bg-slate-950/20', border: 'border-slate-200/50 dark:border-slate-700/30' },
};

function SortableTask({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function StatusDot({ status }: { status: TaskStatus }) {
  return <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_DOT_COLORS[status])} />;
}

export function TaskBoard({ tasks, onTaskClick, onStatusChange }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('TODO');

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      BLOCKED: [],
      CANCELLED: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id as string);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const targetStatus = STATUS_ORDER.find((s) => s === overId) || 
      tasks.find((t) => t.id === overId)?.status;

    if (targetStatus && targetStatus !== tasks.find((t) => t.id === activeTaskId)?.status) {
      onStatusChange(activeTaskId, targetStatus as TaskStatus);
    }
  }, [tasks, onStatusChange]);

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Mobile: Tabs view */}
        <div className="block sm:hidden">
          <Tabs value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as TaskStatus)} className="w-full">
            <TabsList className="flex w-full overflow-x-auto scrollbar-thin mb-4 bg-muted/50 p-1 rounded-lg">
              {STATUS_ORDER.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className={cn(
                    'flex-shrink-0 text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5',
                    STATUS_BG_COLORS[status].bg,
                    STATUS_BG_COLORS[status].border,
                    'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800'
                  )}
                >
                  <StatusDot status={status} />
                  <span>{STATUS_LABELS[status]}</span>
                  <span className="text-xs opacity-70">({tasksByStatus[status].length})</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {STATUS_ORDER.map((status) => (
              <TabsContent key={status} value={status} className="mt-0">
                <div className="bg-card/80 rounded-xl border border-border/70 shadow-sm">
                  <div className="p-3 space-y-3">
                    {tasksByStatus[status].map((task) => (
                      <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))}
                    {tasksByStatus[status].length === 0 && (
                      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground italic">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Desktop: Kanban board */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                id={status}
                className={cn(
                  'rounded-xl border border-border/70 shadow-sm flex flex-col min-h-[320px] sm:min-h-[400px]',
                  STATUS_BG_COLORS[status].bg
                )}
              >
                <div
                  className={cn(
                    'px-4 py-3 border-b font-medium text-sm flex items-center gap-2',
                    STATUS_BG_COLORS[status].border
                  )}
                >
                  <StatusDot status={status} />
                  <span className="text-foreground">{STATUS_LABELS[status]}</span>
                  <span className="ml-auto text-xs font-normal bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <SortableContext
                  id={status}
                  items={tasksByStatus[status].map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-3 space-y-3">
                    {tasksByStatus[status].map((task) => (
                      <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))}
                    {tasksByStatus[status].length === 0 && (
                      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground italic">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-64 sm:w-80 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}