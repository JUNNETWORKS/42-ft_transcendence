import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/createChatroom.dto';
import { PostMessageDto } from './dto/postMessage.dto';
import { UpdateChatroomDto } from './dto/updateChatroom.dto';

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

  create(createChatroomDto: CreateChatroomDto) {
    return this.prisma.chatRoom.create({
      data: {
        roomName: createChatroomDto.roomName,
        roomType: createChatroomDto.roomType,
        roomPassword: createChatroomDto.roomPassword,
        chatUserRelation: {
          create: createChatroomDto.members,
        },
      },
      select: chatroomExcludePass,
    });
  }

  findAll() {
    return this.prisma.chatRoom.findMany({
      select: chatroomExcludePass,
    });
  }

  findOne(id: number) {
    return this.prisma.chatRoom.findUnique({
      where: { id },
      select: chatroomExcludePass,
    });
  }

  update(id: number, updateChatroomDto: UpdateChatroomDto) {
    return this.prisma.chatRoom.update({
      where: { id },
      data: updateChatroomDto,
      select: chatroomExcludePass,
    });
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

  remove(id: number) {
    return this.prisma.chatRoom.delete({
      where: { id },
      select: chatroomExcludePass,
    });
  }

  async getMessagesByCursor(roomId: number, take: number, cursor: number) {
    const result = await this.prisma.chatMessage.findMany({
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
    return result.reverse();
  }

  async getMessages(roomId: number, take: number) {
    const result = await this.prisma.chatMessage.findMany({
      take,
      where: {
        chatRoomId: roomId,
      },
      orderBy: {
        id: 'desc',
      },
    });
    return result.reverse();
  }

  postMessage(postMessageDto: PostMessageDto) {
    return this.prisma.chatMessage.create({
      data: postMessageDto,
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
}
