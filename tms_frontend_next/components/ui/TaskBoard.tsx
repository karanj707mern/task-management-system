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

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  TODO: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-300' },
  IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  IN_REVIEW: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  DONE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  BLOCKED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800/30', text: 'text-slate-700 dark:text-slate-300' },
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
        <div className="block sm:hidden">
          <Tabs value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as TaskStatus)} className="w-full">
            <TabsList className="flex w-full overflow-x-auto scrollbar-thin mb-4 bg-muted/50 p-1 rounded-lg">
              {STATUS_ORDER.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className={cn(
                    'flex-shrink-0 text-xs px-3 py-1.5 rounded-md transition-colors',
                    STATUS_STYLES[status].bg,
                    STATUS_STYLES[status].text,
                    'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800'
                  )}
                >
                  {STATUS_LABELS[status]} ({tasksByStatus[status].length})
                </TabsTrigger>
              ))}
            </TabsList>
            {STATUS_ORDER.map((status) => (
              <TabsContent key={status} value={status} className="mt-0">
                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="p-3 space-y-3">
                    {tasksByStatus[status].map((task) => (
                      <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))}
                    {tasksByStatus[status].length === 0 && (
                      <div className="flex items-center justify-center h-32 text-sm text-slate-400 dark:text-slate-500 italic">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="hidden sm:block -mx-2 sm:mx-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUS_ORDER.filter(s => tasksByStatus[s].length > 0 || s === 'TODO').map((status) => (
              <div
                key={status}
                id={status}
                className="bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col min-h-[320px] sm:min-h-[400px]"
              >
                <div
                  className={cn(
                    'px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 font-medium text-sm',
                    STATUS_STYLES[status].bg,
                    STATUS_STYLES[status].text,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{STATUS_LABELS[status]}</span>
                    <span className="text-xs font-normal bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {tasksByStatus[status].length}
                    </span>
                  </div>
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
                      <div className="flex items-center justify-center h-32 text-sm text-slate-400 dark:text-slate-500 italic">
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