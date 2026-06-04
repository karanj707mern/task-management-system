import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

/**
 * User factory for generating test data
 */
export class UserFactory {
  static async createUserData(overrides?: any) {
    const password = 'Test@123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    return {
      email: faker.internet.email(),
      password: hashedPassword,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'user',
      ...overrides,
    };
  }

  static async createMultiple(count: number, overrides?: any) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUserData(overrides));
    }
    return users;
  }

  static async createAdmin(overrides?: any) {
    return this.createUserData({ role: 'admin', ...overrides });
  }

  static async createManager(overrides?: any) {
    return this.createUserData({ role: 'manager', ...overrides });
  }
}
