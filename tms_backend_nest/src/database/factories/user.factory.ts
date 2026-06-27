import bcrypt from 'bcrypt';

export type UserFactoryData = {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';
};

export type UserFactoryOverrides = Omit<Partial<UserFactoryData>, 'password'> & {
  password: string;
};

function generateEmail(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2)}@adiance.com`;
}

function generateName(email: string): string {
  return email.split('@')[0];
}

export class UserFactory {
  static async createUserData(
    overrides: UserFactoryOverrides,
  ): Promise<UserFactoryData> {
    const { password, ...rest } = overrides;
    const email = rest.email || generateEmail();
    const hashedPassword = await bcrypt.hash(password, 10);

    return {
      email,
      password: hashedPassword,
      name: generateName(email),
      role: 'EMPLOYEE',
      ...rest,
    };
  }

  static async createMultiple(
    count: number,
    overrides: UserFactoryOverrides,
  ): Promise<UserFactoryData[]> {
    const users: UserFactoryData[] = [];

    for (let i = 0; i < count; i++) {
      users.push(await this.createUserData(overrides));
    }

    return users;
  }

  static async createAdmin(
    overrides: UserFactoryOverrides,
  ): Promise<UserFactoryData> {
    return this.createUserData({
      role: 'ADMIN',
      ...overrides,
    });
  }

  static async createSuperAdmin(
    overrides: UserFactoryOverrides,
  ): Promise<UserFactoryData> {
    return this.createUserData({
      role: 'SUPER_ADMIN',
      ...overrides,
    });
  }
}
