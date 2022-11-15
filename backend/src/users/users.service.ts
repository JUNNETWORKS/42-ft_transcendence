import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { passwordConstants } from '../auth/auth.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as Utils from '../utils';
import { ChatroomsService } from '../chatrooms/chatrooms.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private chatRoomService: ChatroomsService
  ) {}

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
  async collectStartingInfomations(id: number) {
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
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}

/**
 * 与えられた生パスワード`password`をハッシュ化する.\
 * ハッシュ化に用いるキーは`passwordConstants.secret`.
 */
export function hash_password(password: string) {
  return createHmac('sha256', passwordConstants.secret)
    .update(password)
    .digest('hex')
    .toString();
}
