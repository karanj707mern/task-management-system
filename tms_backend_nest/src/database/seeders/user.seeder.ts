import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UserFactory } from '../factories/user.factory';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async seed() {
    this.logger.log('Starting user seeding...');

    try {
      const email = this.config.getOrThrow<string>('SEED_ADMIN_EMAIL');
      const password = this.config.getOrThrow<string>('SEED_ADMIN_PASSWORD');
      const adminData = await UserFactory.createAdmin({
        email,
        password,
        name: email.split('@')[0],
      });

      await this.prisma.user.upsert({
        where: { email: adminData.email },
        update: {
          name: adminData.name,
          role: adminData.role,
          password: adminData.password,
        },
        create: adminData,
      });

      this.logger.log(`Admin user seeded: ${adminData.email}`);
      this.logger.log('User seeding completed');
    } catch (error) {
      this.logger.error('Error seeding users', error as string);
      throw error;
    }
  }
}
