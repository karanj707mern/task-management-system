import { Module } from '@nestjs/common';

import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { FileUploadModule } from '@/infrastructure/file-upload/file-upload.module';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { AvatarUploadController } from './avatar-upload.controller';
import { UsersService } from './users.service';
import { UsersWebsocketsModule } from './websockets/users.websockets.module';
import { PermissionService } from '@/shared/permissions/permission.service';

@Module({
  imports: [PrismaModule, FileUploadModule, UsersWebsocketsModule],
  controllers: [UsersController, AvatarUploadController],
  providers: [UsersService, UserRepository, PermissionService],
  exports: [UsersService],
})
export class UsersModule {}
