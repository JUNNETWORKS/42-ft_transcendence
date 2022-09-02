import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { UpdateChatroomDto } from './dto/update-chatroom.dto';

@Injectable()
export class ChatroomsService {
  constructor(private prisma: PrismaService) {}

  create(createChatroomDto: CreateChatroomDto) {
    // TODO: members.userTypeにBANNED, MUTEDが入らないようにする。
    return this.prisma.chatRoom.create({
      data: {
        roomName: createChatroomDto.roomName,
        roomType: createChatroomDto.roomType,
        roomPassword: createChatroomDto.roomPassword,
        chatUserRelation: {
          create: createChatroomDto.members,
        },
      },
    });
  }

  findAll() {
    return this.prisma.chatRoom.findMany();
  }

  findOne(id: number) {
    return this.prisma.chatRoom.findUnique({ where: { id } });
  }

  update(id: number, updateChatroomDto: UpdateChatroomDto) {
    return this.prisma.chatRoom.update({
      where: { id },
      data: updateChatroomDto,
    });
  }

  join(roomId: number, userId: number) {
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
    return this.prisma.chatRoom.delete({ where: { id } });
  }
}
