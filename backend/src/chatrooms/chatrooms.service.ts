import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { User } from '@prisma/client';

import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { OperationJoinDto } from './dto/operation-join.dto';
import { OperationLeaveDto } from './dto/operation-leave.dto';
import { OperationTellDto } from './dto/operation-tell.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { PrismaService } from '../prisma/prisma.service';
import * as Utils from '../utils';
import { chatRoomConstants } from './chatrooms.constant';
import { ChatroomEntity } from './entities/chatroom.entity';

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
      const id = cursor
        ? take > 0
          ? { gt: cursor }
          : { lt: cursor }
        : undefined;
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
          id,
        },
        orderBy: { id: 'asc' },
      });
    })();
    return res.map((o) => new ChatroomEntity(o));
  }

  async findOne(id: number) {
    return await this.prisma.chatRoom.findUnique({
      where: { id },
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
          },
        },
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
    if (take > 0) {
      return await this.prisma.chatMessage.findMany({
        take: -take,
        where: {
          chatRoomId: roomId,
          id: cursor ? { lt: cursor } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });
    } else {
      return await this.prisma.chatMessage.findMany({
        take: -take,
        where: {
          chatRoomId: roomId,
          id: cursor ? { gt: cursor } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });
    }
  }

  postMessage(data: PostMessageDto) {
    return this.prisma.chatMessage.create({ data });
  }

  async createDmRoom(user: User, data: OperationTellDto) {
    return this.create({
      roomName: `dm-uId${user.id}-uId${data.userId}`,
      roomType: 'DM',
      ownerId: user.id,
      roomMember: [
        { userId: user.id, memberType: 'ADMIN' },
        { userId: data.userId, memberType: 'ADMIN' },
      ],
    });
  }

  async execJoin(user: User, data: OperationJoinDto) {
    const userId = user.id;
    const roomId = data.roomId;
    console.log('ft_join', data);

    const rel = await Utils.PromiseMap({
      room: this.findOne(roomId),
      relation: this.getRelation(roomId, user.id),
      attr: this.getAttribute(roomId, user.id),
    });

    // [ 入室対象のチャットルームが存在していることを確認 ]
    if (!rel.room) {
      throw new WsException('not found');
    }
    const room = rel.room;
    // [ 既に入室していないか確認 ]
    if (rel.relation) {
      throw new WsException('joined already');
    }
    // [ 実行者がbanされていないことを確認 ]
    if (rel.attr && rel.attr.bannedEndAt > new Date()) {
      console.log('** you are banned **');
      throw new WsException('banned');
    }
    // lockedの場合、パスワードのチェック
    if (room.roomType === 'LOCKED') {
      if (!data.roomPassword) {
        throw new WsException('no password');
      }
      // hash化されたパスワードをチェックする
      const hashed = this.hash_password(data.roomPassword);
      if (room.roomPassword !== hashed) {
        throw new WsException('invalid password');
      }
    }

    // [ハードリレーション更新]
    const relation = await this.addMember(roomId, {
      userId,
      memberType: 'MEMBER',
    });
    return relation;
  }

  async execLeave(user: User, data: OperationLeaveDto) {
    // [退出対象のチャットルームが存在していることを確認]
    // [実行者が対象チャットルームに入室していることを確認]
    const roomId = data.roomId;
    const relation = await this.getRelation(roomId, user.id);
    if (!relation) {
      throw new WsException('not joined');
    }

    // [ハードリレーション更新]
    await this.removeMember(roomId, user.id);
    return relation;
  }

  /**
   * 生パスワードをハッシュ化する
   */
  private hash_password(password: string) {
    return Utils.hash(
      chatRoomConstants.secret,
      password + chatRoomConstants.pepper,
      1000
    );
  }
}
