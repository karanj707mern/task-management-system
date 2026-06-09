import { faker } from '@faker-js/faker';
import type { Prisma } from '@prisma/client';

type ProjectFactoryData = Prisma.ProjectCreateInput;
type ProjectFactoryOverrides = Partial<ProjectFactoryData>;

/**
 * Project factory for generating test data
 */
export class ProjectFactory {
  static createProjectData(
    overrides: ProjectFactoryOverrides = {},
  ): ProjectFactoryData {
    return {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      ...overrides,
    };
  }

  static createMultiple(
    count: number,
    overrides: ProjectFactoryOverrides = {},
  ): ProjectFactoryData[] {
    const projects: ProjectFactoryData[] = [];
    for (let i = 0; i < count; i++) {
      projects.push(this.createProjectData(overrides));
    }
    return projects;
  }
}
