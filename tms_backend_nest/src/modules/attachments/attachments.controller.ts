import { Controller, Delete, Get, Param, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { multerConfig } from '@/config/multer.config';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':taskId/attachments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadAttachment(
    @Param('taskId', ParseCuidPipe) taskId: string,
    @GetUser('userId') userId: string,
    @UploadedFile() file: any,
  ) {
    return this.attachmentsService.upload(taskId, userId, file);
  }

  @Get(':taskId/attachments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  getAttachments(@Param('taskId', ParseCuidPipe) taskId: string) {
    return this.attachmentsService.findAll(taskId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.attachmentsService.remove(id, userId);
  }
}
