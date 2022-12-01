import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WebSocketGateway } from '@nestjs/websockets';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { pick } from 'src/utils';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { CreateChatroomApiDto } from './dto/create-chatroom-api.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { ChatroomsService } from './chatrooms.service';
import { ChatroomEntity } from './entities/chatroom.entity';
import { CreateChatroomPipe } from './pipe/create-chatroom.pipe';
import { UpdateRoomPipe } from './pipe/update-room.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class ChatroomsController {
  constructor(
    private readonly chatroomsService: ChatroomsService,
    private readonly wsServer: WsServerGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  async create(
    @Request() req: any,
    @Body(new CreateChatroomPipe())
    createChatroomDto: CreateChatroomApiDto
  ) {
    const ownerId = req.user.id;
    const owner: RoomMemberDto = {
      userId: ownerId,
      memberType: 'ADMIN',
    };
    const result = await this.chatroomsService.create({
      ...createChatroomDto,
      ownerId,
      roomMember: [owner],
    });
    this.wsServer.usersJoin(ownerId, { roomId: result.id });
    // 新規作成システムメッセージを生成して通知
    this.wsServer.systemSay(result.id, req.user, 'OPENED');
    this.wsServer.sendResults(
      'ft_open',
      {
        ...pick(result, 'id', 'roomName', 'roomType', 'ownerId'),
      },
      result.roomType === 'PRIVATE' ? { userId: ownerId } : { global: 'global' }
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  async updateRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomPipe())
    updateRoomDto: UpdateRoomDto
  ) {
    console.log('updating:', updateRoomDto);
    const result = await this.chatroomsService.updateRoom(
      roomId,
      updateRoomDto
    );
    this.wsServer.sendResults(
      'ft_chatroom',
      {
        action: 'update',
        id: result.id,
        data: { ...pick(result, 'roomName', 'roomType', 'ownerId') },
      },
      result.roomType === 'PRIVATE'
        ? { roomId: result.id }
        : { global: 'global' }
    );
    return result;
  }

  @Delete(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  remove(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.remove(roomId);
  }
}
