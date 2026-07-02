import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UsersQueryDto } from '@/common/dto/pagination-query.dto';
import { CreateManualUserDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';
import { CreateUserData, UpdateUserData } from './repositories/user.repository';
import { isManagerOrAbove } from '@/common/authorization/authorization';
import { Permission, PermissionService } from '@/shared/permissions/permission.service';

export interface UserQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly permissionService: PermissionService,
  ) {}

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
    this.permissionService.checkPermission(creatorRole, Permission.MANAGE_USERS);
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const role = (data.role as UserRole) || UserRole.EMPLOYEE;
    if (role === UserRole.SUPER_ADMIN && creatorRole !== UserRole.SUPER_ADMIN) {
      throw new NotFoundException('Only Super Admin can create Super Admin users');
    }
    const userData: CreateUserData = {
      ...data,
      name: data.name || data.email.split('@')[0],
      role,
    };
    return this.userRepository.create(userData);
  }

  async findAll(query: UsersQueryDto, requesterRole: UserRole) {
    this.permissionService.checkPermission(requesterRole, Permission.READ_USER);

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
    this.permissionService.checkPermission(updaterRole, Permission.MANAGE_USERS);

    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    if (data.role === UserRole.SUPER_ADMIN && updaterRole !== UserRole.SUPER_ADMIN) {
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
    this.permissionService.checkPermission(requesterRole, Permission.MANAGE_USERS);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.SUPER_ADMIN && requesterRole !== UserRole.SUPER_ADMIN) {
      throw new NotFoundException('Only Super Admin can remove Super Admin users');
    }
    if (user.id === requesterId) {
      throw new NotFoundException('You cannot delete your own account');
    }
    return this.userRepository.softDelete(id);
  }
}
