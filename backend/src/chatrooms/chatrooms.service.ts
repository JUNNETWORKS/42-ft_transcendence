import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/createChatroom.dto';
import { PostMessageDto } from './dto/postMessage.dto';
import { UpdateChatroomDto } from './dto/updateChatroom.dto';
import { UpdateRoomTypeDto } from './dto/updateRoomType.dto';
import { ChatroomEntity } from './entities/chatroom.entity';

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

  async update(id: number, updateChatroomDto: UpdateChatroomDto) {
    const res = await this.prisma.chatRoom.update({
      where: { id },
      data: updateChatroomDto,
    });
    return new ChatroomEntity(res);
  }

  async updateRoomType(id: number, updateRoomTypeDto: UpdateRoomTypeDto) {
    const res = await this.prisma.chatRoom.update({
      where: { id },
      data: updateRoomTypeDto,
    });
    return new ChatroomEntity(res);
  }

  async remove(id: number) {
    const res = await this.prisma.chatRoom.delete({
      where: { id },
    });
    return new ChatroomEntity(res);
  }

  async getMessagesByCursor(roomId: number, take: number, cursor: number) {
    const res = await this.prisma.chatMessage.findMany({
      take,
      skip: 1,
      cursor: {
        id: cursor,
      },
      where: {
        chatRoomId: roomId,
      },
      orderBy: {
        id: 'desc',
      },
    });
    return res.reverse();
  }

  async getMessages(roomId: number, take: number) {
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

  postMessage(postMessageDto: PostMessageDto) {
    // TODO: userがmemberか確認する。
    return this.prisma.chatMessage.create({
      data: postMessageDto,
    });
  }
}
