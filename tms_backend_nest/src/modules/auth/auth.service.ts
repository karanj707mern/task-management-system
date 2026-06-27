import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { EmailService } from '@/infrastructure/mail/mail.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth.constants';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private readonly passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.passwordResetTokens.entries()) {
      if (data.expiresAt < now) {
        this.passwordResetTokens.delete(token);
      }
    }
  }

  getAuthCookie(accessToken: string): string {
    return this.getCookie(AUTH_COOKIE_NAME, accessToken, ACCESS_TOKEN_TTL_SECONDS);
  }

  getRefreshCookie(refreshToken: string): string {
    return this.getCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_TTL_SECONDS);
  }

  getLogoutCookies(): string[] {
    return [this.clearCookie(AUTH_COOKIE_NAME), this.clearCookie(REFRESH_COOKIE_NAME)];
  }

  getCookie(name: string, value: string, maxAge: number): string {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieOptions = [
      `${name}=${value}`,
      'HttpOnly',
      'SameSite=Lax',
      `Path=/`,
      `Max-Age=${maxAge}`,
    ];

    if (isProduction) {
      cookieOptions.push('Secure');
    }

    return cookieOptions.join('; ');
  }

  clearCookie(name: string): string {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const options = ['HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
    if (isProduction) {
      options.push('Secure');
    }
    return `${name}=; ${options.join('; ')}`;
  }

  extractRefreshToken(cookieHeader?: string): string | null {
    if (!cookieHeader) {
      return null;
    }
    const match = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));
    const value = match ? match.split('=')[1] : null;
    return value ? decodeURIComponent(value) : null;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    return this.createTokenPair(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      this.logger.warn(`User ${user.id} has no password set`);
      throw new UnauthorizedException('Invalid credentials');
    }

    let isPasswordValid: boolean;
    try {
      isPasswordValid = await bcrypt.compare(dto.password, user.password);
    } catch (error) {
      this.logger.error(`bcrypt.compare failed for user ${user.id}: ${error}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      this.logger.warn(`Failed to update lastLogin for user ${user.id}: ${error}`);
    }

    return this.createTokenPair(user);
  }

  async logout(cookieHeader?: string) {
    if (cookieHeader) {
      await this.revokeRefreshToken(cookieHeader);
    }
    return { message: 'Logged out successfully' };
  }

  async requestPasswordReset(email: string) {
    this.cleanupExpiredTokens();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { email: true, name: true },
    });

    if (!user) {
      return { message: 'If the email exists, a password reset link will be sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const resetLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`;

    this.passwordResetTokens.set(token, {
      email: user.email,
      expiresAt: Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000,
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    return { message: 'If the email exists, a password reset link will be sent.' };
  }

  async resetPassword(token: string, password: string) {
    const stored = this.passwordResetTokens.get(token);

    if (!stored || stored.expiresAt < Date.now()) {
      this.passwordResetTokens.delete(token);
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: stored.email },
    });

    if (!user) {
      this.passwordResetTokens.delete(token);
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10) },
    });

    this.passwordResetTokens.delete(token);

    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    return { message: 'Password changed successfully' };
  }

  async refresh(cookieHeader?: string) {
    const refreshToken = this.extractRefreshToken(cookieHeader);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = await this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.createTokenPair(storedToken.user);
  }

  async revokeRefreshToken(cookieHeader?: string) {
    const refreshToken = this.extractRefreshToken(cookieHeader);
    if (!refreshToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: await this.hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async createTokenPair(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }) {
    try {
      const accessToken = await this.signAccessToken(user);
      const refreshToken = randomBytes(32).toString('hex');

      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await this.hashRefreshToken(refreshToken),
          expiresAt: this.addSeconds(REFRESH_TOKEN_TTL_SECONDS),
        },
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create token pair for user ${user.id}: ${error}`);
      throw error;
    }
  }

  async signAccessToken(user: { id: string; email: string; role: UserRole }) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  addSeconds(seconds: number): Date {
    return new Date(Date.now() + seconds * 1000);
  }
}
