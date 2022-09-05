import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { CreateChatroomDto } from '../dto/createChatroom.dto';
import { CreateMemberPipe } from './createMember.pipe';

describe('CreateMemberPipe', () => {
  it('should be defined', () => {
    expect(new CreateMemberPipe()).toBeDefined();
  });

  it('members.memberTypeにBANNED,MUTEDが入っている', async () => {
    const target: CreateMemberPipe = new CreateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomMember: [
        { userId: 1, memberType: 'ADMIN' },
        { userId: 2, memberType: 'BANNED' },
      ],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException(
        'new chatroom member type must not be "BANNED" or "MUTED"',
        400
      )
    );
  });
});
