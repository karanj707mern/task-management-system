import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

async function bootstrap() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: email.split('@')[0],
      role: 'SUPER_ADMIN',
      password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      name: email.split('@')[0],
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Super Admin user seeded: ${email}`);
  await prisma.onModuleDestroy();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
