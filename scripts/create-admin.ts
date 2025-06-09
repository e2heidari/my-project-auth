import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: 'ehsan.heydari@gmail.com',
        password: hashedPassword,
        businessName: 'Admin Business',
        emailVerified: new Date(),
      },
    });

    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 