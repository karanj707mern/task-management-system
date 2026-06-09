import { faker } from '@faker-js/faker';
import { TaskStatus, type Prisma } from '@prisma/client';

type TaskFactoryData = Prisma.TaskUncheckedCreateInput;
type TaskFactoryOverrides = Partial<TaskFactoryData>;

/**
 * Task factory for generating test data
 */
export class TaskFactory {
  static createTaskData(
    projectId: string,
    assigneeId: string,
    overrides: TaskFactoryOverrides = {},
  ): TaskFactoryData {
    return {
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(),
      projectId,
      assigneeId,
      status: faker.helpers.arrayElement(Object.values(TaskStatus)),
      ...overrides,
    };
  }

  static createMultiple(
    projectId: string,
    assigneeId: string,
    count: number,
    overrides: TaskFactoryOverrides = {},
  ): TaskFactoryData[] {
    const tasks: TaskFactoryData[] = [];
    for (let i = 0; i < count; i++) {
      tasks.push(this.createTaskData(projectId, assigneeId, overrides));
    }
    return tasks;
  }

  static createInProgress(
    projectId: string,
    assigneeId: string,
    overrides: TaskFactoryOverrides = {},
  ) {
    return this.createTaskData(projectId, assigneeId, {
      status: TaskStatus.IN_PROGRESS,
      ...overrides,
    });
  }
}
