import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { resetTable } from '../../test/testUtils';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    await resetTable(['User']);
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('create user', async () => {
    const email = 'hogehoge@gmail.com';
    const displayName = 'hoge123';
    const user = await service.create({
      email,
      displayName,
      intraId: 1000,
    });
    expect(user.email).toBe(email);
    expect(user.displayName).toBe(displayName);
  });

  it('create user twice with same email', async () => {
    const email = 'hogehoge@gmail.com';
    const displayName = 'hoge123';
    const user = await service.create({ email, displayName, intraId: 1000 });
    expect(user.email).toBe(email);
    expect(user.displayName).toBe(displayName);
    await expect(
      service.create({ email, displayName: 'fuga123', intraId: 1001 })
    ).rejects.toThrow();
  });

  it('create user twice with same displayName', async () => {
    const email = 'hogehoge@gmail.com';
    const displayName = 'hoge123';
    const user = await service.create({ email, displayName, intraId: 1000 });
    expect(user.email).toBe(email);
    expect(user.displayName).toBe(displayName);
    await expect(
      service.create({
        email: 'fugafuga@gmail.com',
        displayName,
        intraId: 1001,
      })
    ).rejects.toThrow();
  });
});
