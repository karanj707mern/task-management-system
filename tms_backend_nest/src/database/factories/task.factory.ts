import { TaskStatus } from '@prisma/client';

type TaskFactoryData = {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  status: TaskStatus;
};

type TaskFactoryOverrides = Partial<Omit<TaskFactoryData, 'projectId' | 'assigneeId'>>;

function generateTitle(): string {
  const titles = [
    'Implement user authentication',
    'Fix critical bug',
    'Optimize database queries',
    'Write unit tests',
    'Update documentation',
  ];
  return titles[Math.floor(Math.random() * titles.length)]!;
}

function generateDescription(): string {
  return 'Task description for testing purposes';
}

export class TaskFactory {
  static async createTaskData(
    projectId: string,
    assigneeId: string,
    overrides: TaskFactoryOverrides = {},
  ): Promise<TaskFactoryData> {
    return {
      title: generateTitle(),
      description: generateDescription(),
      projectId,
      assigneeId,
      status: TaskStatus.TODO,
      ...overrides,
    };
  }

  static async createMultiple(
    projectId: string,
    assigneeId: string,
    count: number,
    overrides: TaskFactoryOverrides = {},
  ): Promise<TaskFactoryData[]> {
    const tasks: TaskFactoryData[] = [];
    for (let i = 0; i < count; i++) {
      tasks.push(await this.createTaskData(projectId, assigneeId, overrides));
    }
    return tasks;
  }

  static async createInProgress(
    projectId: string,
    assigneeId: string,
    overrides: TaskFactoryOverrides = {},
  ): Promise<TaskFactoryData> {
    return this.createTaskData(projectId, assigneeId, {
      status: TaskStatus.IN_PROGRESS,
      ...overrides,
    });
  }
}