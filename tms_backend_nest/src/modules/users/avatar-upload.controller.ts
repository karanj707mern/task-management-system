import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Param, ForbiddenException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UsersService } from './users.service';
import { multerAvatarFileFilter, multerAvatarLimits } from '@/config/multer.config';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Use process.cwd() so the path is consistent whether running from src/ (ts-node)
// or from dist/ (compiled). The server always runs from the project root.
const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

interface MulterFile {
  filename: string;
  originalname: string;
  mimetype: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class AvatarUploadController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        console.log('[AVATAR] Upload destination:', AVATAR_UPLOAD_DIR);
        if (!existsSync(AVATAR_UPLOAD_DIR)) {
          mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
        }
        cb(null, AVATAR_UPLOAD_DIR);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        const filename = `${uniqueSuffix}${ext}`;
        console.log('[AVATAR] Processing file:', file.originalname, '→', filename);
        cb(null, filename);
      },
    }),
    fileFilter: multerAvatarFileFilter,
    limits: multerAvatarLimits,
  }))
  async uploadAvatar(
    @UploadedFile() file: MulterFile,
    @GetUser('userId') userId: string,
  ): Promise<{ avatarUrl: string }> {
    console.log('[AVATAR] uploadAvatar handler called. file:', file ? { filename: file.filename, originalname: file.originalname, mimetype: file.mimetype } : 'NO FILE', 'userId:', userId);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(userId, { avatar: avatarUrl });
    return { avatarUrl };
  }

  @Post(':id/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        console.log('[AVATAR] Upload destination (by id):', AVATAR_UPLOAD_DIR);
        if (!existsSync(AVATAR_UPLOAD_DIR)) {
          mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
        }
        cb(null, AVATAR_UPLOAD_DIR);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        const filename = `${uniqueSuffix}${ext}`;
        console.log('[AVATAR] Processing file (by id):', file.originalname, '→', filename);
        cb(null, filename);
      },
    }),
    fileFilter: multerAvatarFileFilter,
    limits: multerAvatarLimits,
  }))
  async uploadUserAvatar(
    @UploadedFile() file: MulterFile,
    @GetUser('userId') requesterId: string,
    @GetUser('role') requesterRole: string,
    @Param('id', ParseCuidPipe) targetUserId: string,
  ): Promise<{ avatarUrl: string }> {
    console.log('[AVATAR] uploadUserAvatar handler called. file:', file ? { filename: file.filename } : 'NO FILE', 'requesterId:', requesterId, 'targetUserId:', targetUserId);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (requesterId !== targetUserId && requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('You can only update your own avatar');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(targetUserId, { avatar: avatarUrl });
    return { avatarUrl };
  }
}