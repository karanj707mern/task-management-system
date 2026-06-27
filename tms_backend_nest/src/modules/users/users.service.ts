import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UsersQueryDto } from '@/common/dto/pagination-query.dto';
import { CreateManualUserDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';
import { CreateUserData, UpdateUserData } from './repositories/user.repository';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';

export interface UserQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async create(data: { email: string; password: string; name: string; role?: string }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    return this.userRepository.create({
      ...data,
      role: (data.role as UserRole) || 'EMPLOYEE',
    });
  }

  async createManualUser(data: CreateManualUserDto, creatorRole: UserRole) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(creatorRole)) {
      throw new NotFoundException('Not authorized');
    }
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const role = data.role || 'EMPLOYEE';
    if (role === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN') {
      throw new NotFoundException('Only Super Admin can create Super Admin users');
    }
    const userData: CreateUserData = {
      ...data,
      name: data.name || data.email.split('@')[0],
      role,
    };
    return this.userRepository.create(userData);
  }

  async findAll(query: UsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { data, total } = await this.userRepository.findAll(
      skip,
      limit,
      query.search,
      query.role,
      query.isActive,
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, requesterId: string, requesterRole: UserRole) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Non-managers can only view their own profile
    if (!isManagerOrAbove(requesterRole) && user.id !== requesterId) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return user;
  }

  async update(id: string, data: UpdateUserData, updaterRole: UserRole) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (data.role === 'SUPER_ADMIN' && updaterRole !== 'SUPER_ADMIN') {
      throw new NotFoundException('Only Super Admin can assign Super Admin role');
    }
    return this.userRepository.update(id, data);
  }

  async updateProfile(id: string, data: UpdateUserData) {
    const sanitized: UpdateUserData = { ...data };
    if ('role' in sanitized) delete sanitized.role;
    if ('isActive' in sanitized) delete sanitized.isActive;
    return this.userRepository.update(id, sanitized);
  }

  async remove(id: string, requesterRole: UserRole, requesterId: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'SUPER_ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new NotFoundException('Only Super Admin can remove Super Admin users');
    }
    if (user.id === requesterId) {
      throw new NotFoundException('You cannot delete your own account');
    }
    return this.userRepository.softDelete(id);
  }
}
