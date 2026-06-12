import mongoose from 'mongoose';
import { RegisterUser } from '../src/modules/auth/application/RegisterUser.js';
import { MongoUserRepository } from '../src/modules/auth/infrastructure/MongoUserRepository.js';
import { PasswordService } from '../src/modules/auth/infrastructure/PasswordService.js';
import { JwtTokenService } from '../src/modules/auth/infrastructure/JwtTokenService.js';

async function main() {
  await mongoose.connect('mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims');
  console.log('Connected');

  const repo = new MongoUserRepository();
  const pwd = new PasswordService();
  const token = new JwtTokenService();
  const useCase = new RegisterUser(repo, pwd, token);

  try {
    const result = await useCase.execute({
      tenantId: 'ims_reliance',
      email: 'aiinfox@flexacademy.in',
      password: 'Lucky@9856',
      firstName: 'Aiinfox',
      lastName: 'Admin',
    });
    console.log('SUCCESS:', JSON.stringify(result.user, null, 2));
    console.log('Access Token:', result.tokens.accessToken.substring(0, 30) + '...');
  } catch (err: any) {
    console.error('FAILED:', err.message);
    console.error('Full error:', err);
  }

  await mongoose.disconnect();
}

main();
