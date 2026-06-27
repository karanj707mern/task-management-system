export class CacheKeys {
  static user(id: string): string {
    return `user:${id}`;
  }

  static userList(page: number, limit: number): string {
    return `user:list:${page}:${limit}`;
  }

  static project(id: string): string {
    return `project:${id}`;
  }

  static projectList(userId: string, page: number, limit: number): string {
    return `project:list:${userId}:${page}:${limit}`;
  }

  static task(id: string): string {
    return `task:${id}`;
  }

  static taskList(projectId: string, page: number, limit: number): string {
    return `task:list:${projectId}:${page}:${limit}`;
  }

  static team(id: string): string {
    return `team:${id}`;
  }

  static teamList(page: number, limit: number): string {
    return `team:list:${page}:${limit}`;
  }

  static permissions(userId: string): string {
    return `permissions:${userId}`;
  }
}
