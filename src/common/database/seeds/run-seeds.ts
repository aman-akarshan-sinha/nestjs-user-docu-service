import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { UserService } from '../../../modules/user/user.service';
import { UserRole } from '../../../modules/user/entities/user.entity';

async function runSeeds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    console.log('🌱 Starting database seeding...');

    const adminUser = await userService.createUser({
      email: 'admin@example.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
    });

    console.log('✅ Admin user created:', adminUser.email);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Users:');
    console.log('Admin: admin@example.com (temporary password generated)');
    console.log('\n⚠️  Please change passwords after first login!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  } finally {
    await app.close();
  }
}

runSeeds(); 