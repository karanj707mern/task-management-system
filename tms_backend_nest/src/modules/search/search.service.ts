import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { isManagerOrAbove } from '@/common/authorization/authorization';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, userId: string, role: string) {
    if (!query || query.trim().length < 2) {
      return { results: {} };
    }

    const managerOrAbove = isManagerOrAbove(role as any);
    const searchTerm = query.trim();

    const [tasks, projects, teams, users] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          ...(managerOrAbove ? {} : { OR: [{ assigneeId: userId }, { createdById: userId }] }),
        },
        take: 10,
        select: { id: true, title: true, status: true, projectId: true, assigneeId: true },
      }),
      this.prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, status: true },
      }),
      managerOrAbove
        ? this.prisma.team.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            take: 10,
            select: { id: true, name: true, description: true, isActive: true },
          })
        : Promise.resolve([]),
      managerOrAbove
        ? this.prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            take: 10,
            select: { id: true, name: true, email: true, role: true, isActive: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      results: {
        tasks,
        projects,
        teams,
        users,
      },
    };
  }
}
