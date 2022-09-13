import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { UpdateRoomNameDto } from './dto/update-room-name.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ChatroomEntity } from './entities/chatroom.entity';
import { RoomMemberDto } from './dto/room-member.dto';

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

  async findAll() {
    const res = await this.prisma.chatRoom.findMany({
      where: {
        roomType: {
          notIn: 'PRIVATE',
        },
      },
    });
    return res.map((o) => new ChatroomEntity(o));
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
            create: updateRoomMemberDto.roomMember,
          },
        },
      })
      .catch((err) => {
        // TODO: errの種類拾う
        throw new HttpException(`${err}`, 400);
      });
    return new ChatroomEntity(res);
  }

  async updateMember(roomId: number, roomMemberDto: RoomMemberDto) {
    // ONWERはmemberTypeを変更できない。
    const { userId, memberType, endAt } = roomMemberDto;
    const currentRelation =
      await this.prisma.chatUserRelation.findUniqueOrThrow({
        where: {
          userId_chatRoomId: {
            userId: userId,
            chatRoomId: roomId,
          },
        },
      });
    if (currentRelation.memberType === 'OWNER') {
      throw new HttpException('OWNER does not change other member type.', 400);
    }

    return this.prisma.chatUserRelation.update({
      where: {
        userId_chatRoomId: {
          userId: userId,
          chatRoomId: roomId,
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

  async remove(id: number) {
    const res = await this.prisma.chatRoom.delete({ where: { id } });
    return new ChatroomEntity(res);
  }

  async getMessages(roomId: number, take: number, cursor?: number) {
    if (typeof cursor === 'number') {
      const res = await this.prisma.chatMessage.findMany({
        take,
        where: {
          chatRoomId: roomId,
          id: {
            lt: cursor,
          },
        },
        orderBy: {
          id: 'desc',
        },
      });
      return res.reverse();
    } else {
      const res = await this.prisma.chatMessage.findMany({
        take,
        where: {
          chatRoomId: roomId,
        },
        orderBy: {
          id: 'desc',
        },
      });
      return res.reverse();
    }
  }

  postMessage(data: PostMessageDto) {
    // TODO: userがmemberか確認する。
    return this.prisma.chatMessage.create({ data });
  }
}
