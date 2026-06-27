import { UserRole } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  department?: string;
  jobTitle?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  department?: string;
  jobTitle?: string;
  isActive?: boolean;
  password?: string;
  phone?: string;
  avatar?: string;
}

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        department: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(skip: number, take: number, search?: string, role?: UserRole, isActive?: boolean, includeInactive: boolean = false) {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    else if (!includeInactive) where.isActive = true;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          jobTitle: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: CreateUserData) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'EMPLOYEE',
        department: data.department,
        jobTitle: data.jobTitle,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        jobTitle: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: UpdateUserData) {
    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        department: true,
        jobTitle: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
