import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { isManagerOrAbove } from '@/common/authorization/authorization';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, role: string) {
    const baseWhere = isManagerOrAbove(role as any)
      ? {}
      : { OR: [{ assigneeId: userId }, { createdById: userId }] };

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalTasks, tasksByStatusRaw, overdueCount, completedThisWeek, totalHoursLoggedAgg] = await Promise.all([
      this.prisma.task.count({ where: baseWhere }),
      this.prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
        where: baseWhere,
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          status: 'DONE',
          updatedAt: { gte: weekStart },
        },
      }),
      this.prisma.workLog.aggregate({
        where: isManagerOrAbove(role as any) ? {} : { userId },
        _sum: { hours: true },
      }),
    ]);

    const tasksByStatus: Record<string, number> = {};
    for (const item of tasksByStatusRaw) {
      tasksByStatus[item.status] = item._count.id;
    }

    return {
      totalTasks,
      tasksByStatus,
      overdueCount,
      completedThisWeek,
      totalHoursLogged: totalHoursLoggedAgg._sum.hours || 0,
    };
  }
}
