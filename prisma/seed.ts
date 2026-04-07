import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@connectimpact.org';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin already exists:', existingAdmin.email);
    return;
  }

  const password = '123456'; // 6-digit password as per your system
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
      isFirstLogin: false,
    },
  });

  console.log('✅ Admin created successfully:');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
