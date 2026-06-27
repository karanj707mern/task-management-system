import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { multerAvatarConfig, multerConfig } from '@/config/multer.config';

@Global()
@Module({
  imports: [
    MulterModule.register(multerAvatarConfig),
  ],
  exports: [MulterModule],
})
export class AvatarUploadModule {}

@Global()
@Module({
  imports: [
    MulterModule.register(multerConfig),
  ],
  exports: [MulterModule],
})
export class DocumentUploadModule {}

@Global()
@Module({
  imports: [AvatarUploadModule, DocumentUploadModule],
  exports: [AvatarUploadModule, DocumentUploadModule],
})
export class FileUploadModule {}