import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { authenticator } from 'otplib';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFindManyDto } from './dto/user-find-many.dto';

import { passwordConstants } from '../auth/auth.constants';
import { AuthService } from '../auth/auth.service';
import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { PrismaService } from '../prisma/prisma.service';
import * as Utils from '../utils';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private prisma: PrismaService,
    private chatRoomService: ChatroomsService
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        userRankPoint: {
          create: {},
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findMany({ take, cursor }: UserFindManyDto) {
    if (take > 0) {
      return this.prisma.user.findMany({
        take,
        where: {
          id: cursor ? { gt: cursor } : undefined,
        },
        select: {
          id: true,
          displayName: true,
        },
      });
    } else {
      return this.prisma.user.findMany({
        take,
        where: {
          id: cursor ? { lte: cursor } : undefined,
        },
        select: {
          id: true,
          displayName: true,
        },
      });
    }
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

  async findFriend(userId: number, targetUserId: number) {
    return this.prisma.friendRelation.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });
  }

  async addFriend(userId: number, targetUserId: number) {
    return this.prisma.friendRelation.create({
      data: {
        userId,
        targetUserId,
      },
    });
  }

  async removeFriend(userId: number, targetUserId: number) {
    return this.prisma.friendRelation.delete({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });
  }

  async findFriends(userId: number) {
    return this.prisma.friendRelation.findMany({
      where: {
        userId,
      },
      include: {
        targetUser: true,
      },
    });
  }

  async findBlocked(userId: number, targetUserId: number) {
    return this.prisma.blockRelation.findUnique({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });
  }

  async block(userId: number, targetUserId: number) {
    return this.prisma.blockRelation.create({
      data: {
        userId,
        targetUserId,
      },
    });
  }

  async findBlockingUsers(userId: number) {
    return this.prisma.blockRelation.findMany({
      where: {
        userId,
      },
      include: {
        targetUser: true,
      },
    });
  }

  async unblock(userId: number, targetUserId: number) {
    return this.prisma.blockRelation.delete({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId,
        },
      },
    });
  }

  /**
   * ログイン時の初期表示用の情報をかき集める
   * @param id
   */
  async collectStartingInformations(id: number) {
    const r = await Utils.PromiseMap({
      visiblePrivate: this.chatRoomService.findMany({
        take: 40,
        category: 'PRIVATE',
        userId: id,
      }),
      visiblePublic: this.chatRoomService.findMany({ take: 40 }),
      joiningRooms: this.chatRoomService
        .getRoomsJoining(id)
        .then((rs) => rs.map((r) => r.chatRoom)),
      dmRooms: this.chatRoomService
        .getRoomsJoining(id, 'DM_ONLY')
        .then((rs) => rs.map((r) => r.chatRoom)),
      friends: this.findFriends(id).then((fs) => fs.map((d) => d.targetUser)),
      blockingUsers: this.findBlockingUsers(id).then((us) =>
        us.map((d) => d.targetUser)
      ),
    });
    return {
      visibleRooms: Utils.sortBy(
        [...r.visiblePublic, ...r.visiblePrivate],
        (r) => r.id
      ),
      joiningRooms: r.joiningRooms,
      dmRooms: r.dmRooms,
      friends: r.friends,
      blockingUsers: r.blockingUsers,
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const d: Partial<UserEntity> = {
      ...updateUserDto,
    };
    if (d.password) {
      const p = d.password;
      d.password = UsersService.hash_password(p);
      d.invalidateTokenIssuedBefore = new Date();
    }
    return this.prisma.user.update({
      where: { id },
      data: d,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async upsertAvatar(userId: number, avatarDataURL: string) {
    const m = avatarDataURL.match(/^data:([^;]+);([^,]+),(.*)$/);
    if (!m) {
      throw new BadRequestException('unexpected dataurl format');
    }
    const [, mime, , data] = m;
    const buffer = Buffer.from(data, 'base64');

    const result = await this.prisma.userAvatar.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        mime,
        avatar: buffer,
      },
      update: {
        userId,
        mime,
        avatar: buffer,
      },
    });
    return Utils.pick(result, 'id', 'userId', 'mime');
  }

  async enableTwoFa(id: number) {
    const secret = authenticator.generateSecret();
    console.log('secret:', secret);
    await this.prisma.$transaction([
      this.prisma.totpSecret.upsert({
        where: {
          userId: id,
        },
        create: {
          userId: id,
          secret,
        },
        update: {
          userId: id,
          secret,
        },
      }),
      this.prisma.user.update({
        where: {
          id: id,
        },
        data: {
          isEnabled2FA: true,
          invalidateTokenIssuedBefore: new Date(),
        },
      }),
    ]);
    return await this.authService.generateQrCode(id, secret);
  }

  async disableTwoFa(id: number) {
    await this.prisma.$transaction([
      this.prisma.totpSecret.delete({
        where: {
          userId: id,
        },
      }),
      this.prisma.user.update({
        where: {
          id: id,
        },
        data: {
          isEnabled2FA: false,
        },
      }),
    ]);
    return;
  }

  async getAvatar(id: number) {
    const avatar = await this.prisma.userAvatar.findUnique({
      where: {
        userId: id,
      },
    });
    if (!avatar) {
      throw new NotFoundException('avatar is not found');
    }
    return {
      mime: avatar.mime,
      avatar: new StreamableFile(avatar.avatar),
      lastModified: avatar.lastModified,
    };
  }

  /**
   * 生パスワードをハッシュ化する.\
   */
  static hash_password(password: string) {
    return Utils.hash(
      passwordConstants.secret,
      password + passwordConstants.pepper,
      1000
    );
  }
}
