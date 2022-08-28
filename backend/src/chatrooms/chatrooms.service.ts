import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { UpdateChatroomDto } from './dto/update-chatroom.dto';

@Injectable()
export class ChatroomsService {
  constructor(private prisma: PrismaService) {}

  create(createChatroomDto: CreateChatroomDto) {
    return this.prisma.chatRoom.create({ data: createChatroomDto });
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

  join(id: number) {
    const userId = 1; // temp、リクエストしたユーザー想定
    return this.prisma.chatUserRelation.create({
      data: { userId: userId, chatRoomId: id },
    });
  }

  remove(id: number) {
    return this.prisma.chatRoom.delete({ where: { id } });
  }
}
