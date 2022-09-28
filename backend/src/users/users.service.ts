import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByIntraId(intraId: number) {
    return this.prisma.user.findUnique({ where: { intraId } });
  }

  countByDisplayName(displayName: string) {
    return this.prisma.user.count({
      where: {
        displayName,
      },
    });
  }

  async findUniqueNameByPrefix(prefix: string) {
    const users = await this.prisma.user.findMany({
      where: {
        displayName: {
          startsWith: prefix,
        },
      },
      select: {
        displayName: true,
      },
    });
    const name_dict: { [K: string]: boolean } = {};
    users.forEach((u) => (name_dict[u.displayName] = true));
    for (let i = 1; ; ++i) {
      const name = `${prefix}_${i}`;
      if (name_dict[name]) {
        continue;
      }
      const n = await this.countByDisplayName(name);
      if (n > 0) {
        continue;
      }
      return name;
    }
    // ここには到達しないはず
    throw Error('something wrong');
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
