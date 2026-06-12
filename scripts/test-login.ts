import mongoose from 'mongoose';
import { LoginUser } from '../src/modules/auth/application/LoginUser.js';
import { MongoUserRepository } from '../src/modules/auth/infrastructure/MongoUserRepository.js';
import { PasswordService } from '../src/modules/auth/infrastructure/PasswordService.js';
import { JwtTokenService } from '../src/modules/auth/infrastructure/JwtTokenService.js';

async function main() {
  await mongoose.connect('mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims');
  console.log('Connected');

  const repo = new MongoUserRepository();
  const pwd = new PasswordService();
  const token = new JwtTokenService();
  const useCase = new LoginUser(repo, pwd, token);

  try {
    const result = await useCase.execute({
      tenantId: 'ims_reliance',
      email: 'aiinfox@flexacademy.in',
      password: 'Lucky@9856',
    });
    console.log('LOGIN SUCCESS');
    console.log('User:', JSON.stringify(result.user, null, 2));
    console.log('Access Token:', result.tokens.accessToken.substring(0, 50) + '...');
  } catch (err: any) {
    console.error('LOGIN FAILED:', err.message);
  }

  await mongoose.disconnect();
}

main();
