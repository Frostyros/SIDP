import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'inspektorat';

async function main() {
  console.log('Seeding initial data...');
  console.log('Default password for all users: "inspektorat"');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sidp.gov' },
    update: { password: hashedPassword },
    create: {
      name: 'System Admin',
      email: 'admin@sidp.gov',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const inputerUser = await prisma.user.upsert({
    where: { email: 'inputer@sidp.gov' },
    update: { password: hashedPassword },
    create: {
      name: 'Staff Inputer',
      email: 'inputer@sidp.gov',
      password: hashedPassword,
      role: 'INPUTER',
    },
  });

  console.log('Seeded Users:');
  console.log(`- ${adminUser.email} (ADMIN) → password: ${DEFAULT_PASSWORD}`);
  console.log(`- ${inputerUser.email} (INPUTER) → password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
