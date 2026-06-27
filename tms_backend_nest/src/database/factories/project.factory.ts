type ProjectFactoryData = {
  name: string;
  description: string | null;
};

type ProjectFactoryOverrides = Partial<ProjectFactoryData>;

function generateName(): string {
  const names = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta', 'Project Epsilon'];
  return names[Math.floor(Math.random() * names.length)]!;
}

function generateDescription(): string {
  return 'Project description for testing purposes';
}

export class ProjectFactory {
  static async createProjectData(
    overrides: ProjectFactoryOverrides = {},
  ): Promise<ProjectFactoryData> {
    return {
      name: generateName(),
      description: generateDescription(),
      ...overrides,
    };
  }

  static async createMultiple(
    count: number,
    overrides: ProjectFactoryOverrides = {},
  ): Promise<ProjectFactoryData[]> {
    const projects: ProjectFactoryData[] = [];
    for (let i = 0; i < count; i++) {
      projects.push(await this.createProjectData(overrides));
    }
    return projects;
  }
}