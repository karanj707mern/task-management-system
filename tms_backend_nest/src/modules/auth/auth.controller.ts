import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    res.setHeader('Set-Cookie', [
      this.authService.getAuthCookie(result.accessToken),
      this.authService.getRefreshCookie(result.refreshToken),
    ]);
    return this.toPublicAuthResponse(result);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.setHeader('Set-Cookie', [
      this.authService.getAuthCookie(result.accessToken),
      this.authService.getRefreshCookie(result.refreshToken),
    ]);
    return this.toPublicAuthResponse(result);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refresh(req.headers.cookie);
    res.setHeader('Set-Cookie', [
      this.authService.getAuthCookie(result.accessToken),
      this.authService.getRefreshCookie(result.refreshToken),
    ]);
    return this.toPublicAuthResponse(result);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeRefreshToken(req.headers.cookie);
    res.setHeader('Set-Cookie', this.authService.getLogoutCookies());
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  private toPublicAuthResponse(result: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: unknown;
  }) {
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      tokenType: result.tokenType,
      user: result.user,
    };
  }
}
