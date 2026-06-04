import { faker } from '@faker-js/faker';

/**
 * Project factory for generating test data
 */
export class ProjectFactory {
  static createProjectData(userId: string, overrides?: any) {
    return {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      color: faker.color.rgb(),
      createdBy: userId,
      ...overrides,
    };
  }

  static createMultiple(userId: string, count: number, overrides?: any) {
    const projects = [];
    for (let i = 0; i < count; i++) {
      projects.push(this.createProjectData(userId, overrides));
    }
    return projects;
  }
}
