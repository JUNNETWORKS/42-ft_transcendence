import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { PrismaService } from '../prisma/prisma.service';
import * as Utils from '../utils';
import { chatRoomConstants } from './chatrooms.constant';
import { ChatroomEntity } from './entities/chatroom.entity';

const selectForUser = {
  id: true,
  displayName: true,
  isEnabledAvatar: true,
};

@Injectable()
export class ChatroomsService {
  constructor(private prisma: PrismaService) {}

  async create(createChatroomDto: CreateChatroomDto) {
    return this.prisma.chatRoom.create({
      data: {
        ...createChatroomDto,
        roomMember: {
          create: createChatroomDto.roomMember,
        },
        ...(() => {
          const { roomType, roomPassword } = createChatroomDto;
          if (roomType === 'LOCKED' && roomPassword) {
            return { roomPassword: this.hash_password(roomPassword) };
          } else {
            return {};
          }
        })(),
      },
      include:
        createChatroomDto.roomType === 'DM'
          ? {
              roomMember: {
                include: {
                  user: true,
                },
              },
            }
          : null,
    });
  }

  async findMany(getChatroomsDto: GetChatroomsDto) {
    const { take, cursor, category } = getChatroomsDto;
    const res = await (async () => {
      if (category === 'PRIVATE') {
        if (typeof getChatroomsDto.userId !== 'number') {
          throw new BadRequestException();
        }
        const rels = await this.getRoomsJoining(
          getChatroomsDto.userId,
          'PRIVATE_ONLY'
        );
        return rels.map((rel) => rel.chatRoom);
      }
      return this.prisma.chatRoom.findMany({
        take: take,
        where: {
          roomType: (() => {
            switch (category) {
              case 'DM':
                return {
                  in: ['DM'],
                };
              default:
                return {
                  in: ['PUBLIC', 'LOCKED'],
                };
            }
          })(),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(typeof cursor === 'number'
          ? { cursor: { id: cursor }, skip: 1 }
          : {}),
        include: {
          owner: {
            select: selectForUser,
          },
        },
      });
    })();
    console.log(res);
    return res;
  }

  async findOne(id: number) {
    return await this.prisma.chatRoom.findUnique({
      where: { id },
      include: {
        owner: {
          select: selectForUser,
        },
      },
    });
  }

  getMembers(roomId: number) {
    // TODO: バンされているユーザーをどう扱うか
    return this.prisma.chatUserRelation.findMany({
      where: {
        chatRoomId: roomId,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * ユーザを指定して, joinしているチャットルームを取得する
   * @param userId
   * @returns
   */
  getRoomsJoining(userId: number, category?: 'PRIVATE_ONLY' | 'DM_ONLY') {
    return this.prisma.chatUserRelation.findMany({
      where: {
        userId,
        chatRoom: {
          roomType: (() => {
            switch (category) {
              case 'DM_ONLY':
                return {
                  in: ['DM'],
                };
              case 'PRIVATE_ONLY':
                return {
                  in: ['PRIVATE'],
                };
              default:
                return {
                  in: ['PUBLIC', 'LOCKED', 'PRIVATE'],
                };
            }
          })(),
        },
      },
      include: {
        chatRoom: {
          include: {
            roomMember:
              category === 'DM_ONLY'
                ? {
                    include: {
                      user: true,
                    },
                  }
                : false,
            owner: {
              select: selectForUser,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ルームとユーザを指定して, リレーションおよびルーム情報を取得する
   * @param chatRoomId
   * @param userId
   * @returns
   */
  getRelation(chatRoomId: number, userId: number) {
    return this.prisma.chatUserRelation.findUnique({
      where: {
        userId_chatRoomId: {
          chatRoomId,
          userId,
        },
      },
      include: {
        chatRoom: true,
      },
    });
  }

  getRelationWithUser(chatRoomId: number, userId: number) {
    return this.prisma.chatUserRelation.findFirst({
      where: {
        chatRoomId,
        userId,
      },
      include: {
        chatRoom: true,
        user: true,
      },
    });
  }

  getAttribute(chatRoomId: number, userId: number) {
    return this.prisma.chatUserAttribute.findFirst({
      where: {
        chatRoomId,
        userId,
      },
    });
  }

  upsertAttribute(
    chatRoomId: number,
    userId: number,
    upArg: {
      bannedEndAt?: Date;
      mutedEndAt?: Date;
    }
  ) {
    return this.prisma.chatUserAttribute.upsert({
      where: {
        userId_chatRoomId: {
          chatRoomId,
          userId,
        },
      },
      create: {
        chatRoomId,
        userId,
        ...upArg,
      },
      update: upArg,
    });
  }

  async updateRoom(id: number, updateRoomDto: UpdateRoomDto) {
    const { roomType, roomPassword, roomName } = updateRoomDto;
    const before = await this.prisma.chatRoom.findUnique({
      where: {
        id,
      },
    });
    if (!before) {
      throw new HttpException('object not found', 400);
    }
    // [roomType と roomPassword]
    // - roomType が LOCKED である
    //   - 変更前の roomType が LOCKED でない かつ roomPassword が空欄
    //     - Bad Request ... (A)
    //   - 変更前の roomType が LOCKED である かつ roomPassword が空欄
    //     - パスワードを変更しない ... (B)
    //   - roomPassword が空欄でない
    //     - パスワードを変更する ... (C)
    // - roomType が LOCKED でない
    //   - パスワードを削除する ... (D)
    if (
      roomType === 'LOCKED' &&
      before.roomType !== roomType &&
      !roomPassword
    ) {
      throw new HttpException('password is needed', 400); // (A)
    }
    const res = await this.prisma.chatRoom.update({
      where: { id },
      data: {
        roomType: roomType,
        ...(() => {
          if (roomType === 'LOCKED') {
            if (roomPassword) {
              return { roomPassword: this.hash_password(roomPassword) }; // (C)
            } else {
              return {}; // (B)
            }
          } else {
            return { roomPassword: null }; // (D)
          }
        })(),
        roomName,
      },
    });
    return new ChatroomEntity(res);
  }

  async addMember(
    chatRoomId: number,
    createRoomMemberDto: CreateRoomMemberDto
  ) {
    const { userId, memberType } = createRoomMemberDto;
    return await this.prisma.chatUserRelation.create({
      data: {
        userId,
        chatRoomId,
        memberType,
      },
      include: {
        chatRoom: true,
        user: true,
      },
    });
  }

  // usersに指定したユーザーをmemberとしてルームに追加する
  async addMembers(chatRoomId: number, users: number[]) {
    return await this.prisma.chatUserRelation.createMany({
      data: users.map((userId) => ({ chatRoomId, userId })),
    });
  }

  async updateMember(chatRoomId: number, roomMemberDto: RoomMemberDto) {
    // ONWERはmemberTypeを変更できない。
    const { userId, memberType } = roomMemberDto;
    const roomInfo = await this.findOne(chatRoomId);
    // TODO: 指定されたroomが存在しなかった時の対応
    if (roomInfo!.ownerId === userId) {
      throw new HttpException('Room owner must be administrator.', 400);
    }

    return this.prisma.chatUserRelation.update({
      where: {
        userId_chatRoomId: {
          userId: userId,
          chatRoomId,
        },
      },
      data: {
        memberType: memberType,
      },
    });
  }

  async removeMember(chatRoomId: number, userId: number) {
    const res = await this.prisma.chatUserRelation.delete({
      where: {
        userId_chatRoomId: {
          userId,
          chatRoomId,
        },
      },
    });
    return res;
  }

  async remove(id: number) {
    const res = await this.prisma.chatRoom.delete({ where: { id } });
    return new ChatroomEntity(res);
  }

  async getMessages(getMessageDto: GetMessagesDto) {
    // TODO: userとchatroomの関係確認。-> pipe?
    const { roomId, take, cursor } = getMessageDto;
    return await this.prisma.chatMessage.findMany({
      take: -take,
      where: {
        chatRoomId: roomId,
        id: cursor ? (take > 0 ? { lt: cursor } : { gt: cursor }) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        secondaryUser: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  postMessage(data: PostMessageDto) {
    // TODO: userがmemberか確認する。
    return this.prisma.chatMessage.create({ data });
  }

  /**
   * 生パスワードをハッシュ化する
   */
  hash_password(password: string) {
    return Utils.hash(
      chatRoomConstants.secret,
      password + chatRoomConstants.pepper,
      1000
    );
  }
}
