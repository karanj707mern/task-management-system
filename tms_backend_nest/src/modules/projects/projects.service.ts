import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsQueryDto } from '@/common/dto/pagination-query.dto';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.githubRepoId && { githubRepoId: dto.githubRepoId }),
        ...(dto.githubRepoUrl && { githubRepoUrl: dto.githubRepoUrl }),
      },
    });
  }

  async findAll(query: ProjectsQueryDto, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = {};

    // Non-managers: only see projects where they are assignee on tasks
    if (!isManagerOrAbove(role)) {
      where.tasks = {
        some: {
          assigneeId: userId,
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const take = query.limit ?? 50;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    const project = await this.prisma.project.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can update projects');
    }
    await this.findOne(id, role);

    return this.prisma.project.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can delete projects');
    }
    await this.findOne(id, role);

    return this.prisma.project.delete({
      where: {
        id,
      },
    });
  }
}
