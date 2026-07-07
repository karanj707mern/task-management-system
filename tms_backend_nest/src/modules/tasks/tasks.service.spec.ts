import { Test, TestingModule } from '@nestjs/testing';
import { DomainEventEmitter } from '@/events/emitters/domain-event.emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { PermissionService } from '@/shared/permissions/permission.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: DomainEventEmitter,
          useValue: {},
        },
        {
          provide: PermissionService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
