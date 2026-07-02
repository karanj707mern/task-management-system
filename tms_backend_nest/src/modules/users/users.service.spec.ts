import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PermissionService } from '@/shared/permissions/permission.service';
import { UserRepository } from './repositories/user.repository';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: { findAll: jest.Mock; findByEmail: jest.Mock; create: jest.Mock; findById: jest.Mock; update: jest.Mock; softDelete: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PermissionService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows employees to list users for task assignment and collaboration', async () => {
    const result = await service.findAll({ page: 1, limit: 10 }, UserRole.EMPLOYEE);

    expect(userRepository.findAll).toHaveBeenCalledWith(0, 10, undefined, undefined, undefined);
    expect(result).toEqual({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    });
  });
});
