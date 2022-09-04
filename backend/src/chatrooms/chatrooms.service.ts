import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/createChatroom.dto';
import { PostMessageDto } from './dto/postMessage.dto';
import { UpdateChatroomDto } from './dto/updateChatroom.dto';
import { ChatroomEntity } from './entities/chatroom.entity';

const chatroomExcludePass: Prisma.ChatRoomSelect = {
  id: true,
  roomName: true,
  roomType: true,
  roomPassword: false,
  createdAt: true,
};

@Injectable()
export class ChatroomsService {
  constructor(private prisma: PrismaService) {}

  async create(createChatroomDto: CreateChatroomDto) {
    const res = await this.prisma.chatRoom.create({
      data: {
        roomName: createChatroomDto.roomName,
        roomType: createChatroomDto.roomType,
        roomPassword: createChatroomDto.roomPassword,
        chatUserRelation: {
          create: createChatroomDto.members,
        },
      },
    });
    return new ChatroomEntity(res);
  }

  async findAll() {
    const res = await this.prisma.chatRoom.findMany();
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
        userType: {
          notIn: 'BANNED',
        },
      },
    });
  }

  async update(id: number, updateChatroomDto: UpdateChatroomDto) {
    const res = await this.prisma.chatRoom.update({
      where: { id },
      data: updateChatroomDto,
      select: chatroomExcludePass,
    });
    return new ChatroomEntity(res);
  }

  async remove(id: number) {
    const res = await this.prisma.chatRoom.delete({
      where: { id },
      select: chatroomExcludePass,
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
    return this.prisma.chatMessage.create({
      data: postMessageDto,
    });
  }
}
