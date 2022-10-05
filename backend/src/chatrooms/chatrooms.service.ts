import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { UpdateRoomNameDto } from './dto/update-room-name.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ChatroomEntity } from './entities/chatroom.entity';
import { RoomMemberDto } from './dto/room-member.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';

@Injectable()
export class ChatroomsService {
  constructor(private prisma: PrismaService) {}

  async create(createChatroomDto: CreateChatroomDto) {
    const res = await this.prisma.chatRoom.create({
      data: {
        ...createChatroomDto,
        roomMember: {
          create: createChatroomDto.roomMember,
        },
      },
    });
    return new ChatroomEntity(res);
  }

  async findMany(getChatroomsDto: GetChatroomsDto) {
    const { take, cursor } = getChatroomsDto;
    if (take > 0) {
      const res = await this.prisma.chatRoom.findMany({
        take: take,
        where: {
          roomType: {
            notIn: 'PRIVATE',
          },
          id: cursor ? { gt: cursor } : undefined,
        },
        orderBy: { id: 'asc' },
      });
      return res.map((o) => new ChatroomEntity(o));
    } else {
      const res = await this.prisma.chatRoom.findMany({
        take: take,
        where: {
          roomType: {
            notIn: 'PRIVATE',
          },
          id: cursor ? { lt: cursor } : undefined,
        },
        orderBy: { id: 'asc' },
      });
      return res.map((o) => new ChatroomEntity(o));
    }
  }

  async findOne(id: number) {
    const res = await this.prisma.chatRoom
      .findUniqueOrThrow({
        where: { id },
      })
      .catch((err) => {
        // TODO: errの種類拾う
        throw new HttpException(`${err}`, 400);
      });
    return new ChatroomEntity(res);
  }

  join(roomId: number, userId: number) {
    // TODO: userTypeに応じた処理
    return this.prisma.chatUserRelation.create({
      data: {
        userId: userId,
        chatRoomId: roomId,
      },
    });
  }

  leave(roomId: number, userId: number) {
    // TODO: userTypeに応じた処理
    return this.prisma.chatUserRelation.delete({
      where: {
        userId_chatRoomId: {
          userId: userId,
          chatRoomId: roomId,
        },
      },
    });
  }

  getMembers(roomId: number) {
    return this.prisma.chatUserRelation.findMany({
      where: {
        chatRoomId: roomId,
        memberType: {
          notIn: 'BANNED',
        },
      },
    });
  }

  /**
   * ユーザを指定して, joinしているチャットルームを取得する
   * @param userId
   * @returns
   */
  getRoomsJoining(userId: number) {
    return this.prisma.chatUserRelation.findMany({
      where: {
        userId,
      },
      include: {
        chatRoom: true,
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
    return this.prisma.chatUserRelation.findFirst({
      where: {
        chatRoomId,
        userId,
      },
      include: {
        chatRoom: true,
      },
    });
  }

  async updateRoomType(id: number, updateRoomTypeDto: UpdateRoomTypeDto) {
    const { roomType, roomPassword } = updateRoomTypeDto;
    const res = await this.prisma.chatRoom.update({
      where: { id },
      data: {
        roomType: roomType,
        roomPassword: roomType !== 'LOCKED' ? null : roomPassword,
      },
    });
    return new ChatroomEntity(res);
  }

  async updateRoomName(id: number, updateRoomNameDto: UpdateRoomNameDto) {
    const res = await this.prisma.chatRoom
      .update({
        where: { id },
        data: updateRoomNameDto,
      })
      .catch((err) => {
        // TODO: errの種類拾う
        throw new HttpException(`${err}`, 400);
      });
    return new ChatroomEntity(res);
  }

  async addMember(id: number, updateRoomMemberDto: CreateRoomMemberDto) {
    const res = await this.prisma.chatRoom
      .update({
        where: { id },
        data: {
          roomMember: {
            create: updateRoomMemberDto,
          },
        },
      })
      .catch((err) => {
        // TODO: errの種類拾う
        throw new HttpException(`${err}`, 400);
      });
    return new ChatroomEntity(res);
  }

  async updateMember(chatRoomId: number, roomMemberDto: RoomMemberDto) {
    // ONWERはmemberTypeを変更できない。
    const { userId, memberType, endAt } = roomMemberDto;
    const roomInfo = await this.findOne(chatRoomId);
    if (roomInfo.ownerId === userId) {
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
        endAt: !(memberType === 'BANNED' || memberType === 'MUTED')
          ? null
          : endAt,
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
        orderBy: { id: 'asc' },
      });
    } else {
      return await this.prisma.chatMessage.findMany({
        take: -take,
        where: {
          chatRoomId: roomId,
          id: cursor ? { gt: cursor } : undefined,
        },
        orderBy: { id: 'asc' },
      });
    }
  }

  postMessage(data: PostMessageDto) {
    // TODO: userがmemberか確認する。
    return this.prisma.chatMessage.create({ data });
  }
}
