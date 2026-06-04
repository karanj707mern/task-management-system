import { faker } from '@faker-js/faker';
import { TaskStatus, TaskPriority } from '../../common/constants/app.constants';

/**
 * Task factory for generating test data
 */
export class TaskFactory {
  static createTaskData(projectId: string, overrides?: any) {
    return {
      title: faker.hacker.phrase(),
      description: faker.lorem.paragraph(),
      projectId,
      status: faker.helpers.arrayElement(Object.values(TaskStatus)),
      priority: faker.helpers.arrayElement(Object.values(TaskPriority)),
      dueDate: faker.date.future(),
      ...overrides,
    };
  }

  static createMultiple(projectId: string, count: number, overrides?: any) {
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(this.createTaskData(projectId, overrides));
    }
    return tasks;
  }

  static createInProgress(projectId: string, overrides?: any) {
    return this.createTaskData(projectId, {
      status: TaskStatus.IN_PROGRESS,
      ...overrides,
    });
  }

  static createUrgent(projectId: string, overrides?: any) {
    return this.createTaskData(projectId, {
      priority: TaskPriority.URGENT,
      ...overrides,
    });
  }
}
