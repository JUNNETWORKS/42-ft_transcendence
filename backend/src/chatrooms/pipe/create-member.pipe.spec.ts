import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { CreateChatroomDto } from '../dto/create-chatroom.dto';
import { CreateMemberPipe } from './create-member.pipe';

describe('CreateMemberPipe', () => {
  it('success', async () => {
    const target: CreateMemberPipe = new CreateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: [
        { userId: 1, memberType: 'ADMIN' },
        { userId: 2, memberType: 'MEMBER' },
      ],
    };
    expect(target.transform(dto, metadata)).toEqual(dto);
  });

  it('members.memberTypeにBANNEDが入っている', async () => {
    const target: CreateMemberPipe = new CreateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: [
        { userId: 1, memberType: 'ADMIN' },
        { userId: 2, memberType: 'BANNED' },
      ],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('new chatroom member type must not be "BANNED"', 400)
    );
  });

  it('members.memberTypeにMUTEDが入っている', async () => {
    const target: CreateMemberPipe = new CreateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: [
        { userId: 1, memberType: 'MUTED' },
        { userId: 2, memberType: 'ADMIN' },
      ],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('new chatroom member type must not be "MUTED"', 400)
    );
  });
});
