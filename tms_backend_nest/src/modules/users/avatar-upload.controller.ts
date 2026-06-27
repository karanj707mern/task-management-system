import { Controller, Patch, UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Param, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UsersService } from './users.service';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class AvatarUploadController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: UploadedFile,
    @GetUser('userId') userId: string,
  ): Promise<{ avatarUrl: string }> {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(userId, { avatar: avatarUrl });
    return { avatarUrl };
  }

  @Patch(':id/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @UploadedFile() file: UploadedFile,
    @GetUser('userId') requesterId: string,
    @GetUser('role') requesterRole: string,
    @Param('id', ParseCuidPipe) targetUserId: string,
  ): Promise<{ avatarUrl: string }> {
    if (requesterId !== targetUserId && requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('You can only update your own avatar');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(targetUserId, { avatar: avatarUrl });
    return { avatarUrl };
  }
}