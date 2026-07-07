import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '@/infrastructure/mail/mail.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return 'production';
              return undefined;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses cross-origin partitioned cookies for tokens', () => {
    const accessCookie = service.getAuthCookie('access-token');
    const refreshCookie = service.getRefreshCookie('refresh-token');

    expect(accessCookie).toContain('SameSite=None');
    expect(refreshCookie).toContain('SameSite=None');
    expect(accessCookie).toContain('Secure');
    expect(refreshCookie).toContain('Secure');
    expect(accessCookie).toContain('Partitioned');
    expect(refreshCookie).toContain('Partitioned');
  });

  it('uses deterministic refresh token digests for database lookups', async () => {
    const token = 'refresh-token';

    await expect(service.hashRefreshToken(token)).resolves.toEqual(
      await service.hashRefreshToken(token),
    );
    await expect(service.hashRefreshToken(token)).resolves.not.toEqual(token);
  });
});
