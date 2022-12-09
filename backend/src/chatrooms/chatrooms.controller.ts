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
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WebSocketGateway } from '@nestjs/websockets';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { pick } from 'src/utils';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { CreateChatroomApiDto } from './dto/create-chatroom-api.dto';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';
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
    @Request() req: any,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomPipe())
    updateRoomDto: UpdateRoomDto
  ) {
    console.log('updating:', updateRoomDto);
    const current = await this.chatroomsService.findOne(roomId);
    if (!current) {
      throw new NotFoundException('no such room');
    }
    const result = await this.chatroomsService.updateRoom(
      current.id,
      updateRoomDto
    );
    // 新規作成システムメッセージを生成して通知
    // (**差分**をsubpayloadに入れておく)
    const updateDiff = (() => {
      const diff: any = {};
      if (current.roomName !== result.roomName) {
        diff.roomName = result.roomName;
      }
      if (current.roomType !== result.roomType) {
        diff.roomType = result.roomType;
      }
      return diff;
    })();
    if (Object.keys(updateDiff).length > 0) {
      this.wsServer.systemSaywithPayload(
        result.id,
        req.user,
        'UPDATED',
        updateDiff
      );
    }
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

  @UseGuards(JwtAuthGuard)
  @Get()
  getRooms(@Query() query: GetChatroomsDto) {
    console.log('query', query);
    return this.chatroomsService.findMany(query);
  }
}
