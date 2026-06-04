import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UserFactory } from '../factories/user.factory';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';

/**
 * User seeder for database initialization
 */
@Injectable()
export class UserSeeder {
  constructor(
    private prisma: PrismaService,
    private logger: AppLogger,
  ) {}

  async seed() {
    this.logger.log('Starting user seeding...');

    try {
      // Create admin user
      const adminData = await UserFactory.createAdmin({
        email: 'admin@example.com',
      });
      await this.prisma.user.upsert({
        where: { email: adminData.email },
        update: {},
        create: adminData,
      });
      this.logger.log('Admin user seeded');

      // Create manager user
      const managerData = await UserFactory.createManager({
        email: 'manager@example.com',
      });
      await this.prisma.user.upsert({
        where: { email: managerData.email },
        update: {},
        create: managerData,
      });
      this.logger.log('Manager user seeded');

      // Create regular users
      const users = await UserFactory.createMultiple(5);
      for (const user of users) {
        await this.prisma.user.create({ data: user });
      }
      this.logger.log('5 regular users seeded');

      this.logger.log('User seeding completed');
    } catch (error) {
      this.logger.error('Error seeding users', error.message);
      throw error;
    }
  }
}
