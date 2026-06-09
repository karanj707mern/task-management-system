import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export type UserFactoryData = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

export type UserFactoryOverrides = Partial<UserFactoryData>;

/**
 * User factory for generating test data
 */
export class UserFactory {
  static async createUserData(
    overrides: UserFactoryOverrides = {},
  ): Promise<UserFactoryData> {
    const password = 'Test@123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    return {
      email: faker.internet.email(),
      password: hashedPassword,
      name: faker.person.fullName(),
      role: UserRole.EMPLOYEE,
      ...overrides,
    };
  }

  static async createMultiple(
    count: number,
    overrides: UserFactoryOverrides = {},
  ): Promise<UserFactoryData[]> {
    const users: UserFactoryData[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUserData(overrides));
    }
    return users;
  }

  static async createAdmin(
    overrides: UserFactoryOverrides = {},
  ): Promise<UserFactoryData> {
    return this.createUserData({ role: UserRole.ADMIN, ...overrides });
  }

  static async createManager(
    overrides: UserFactoryOverrides = {},
  ): Promise<UserFactoryData> {
    return this.createUserData({ role: UserRole.EMPLOYEE, ...overrides });
  }
}
