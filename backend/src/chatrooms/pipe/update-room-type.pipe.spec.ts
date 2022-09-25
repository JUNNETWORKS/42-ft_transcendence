import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { UpdateRoomTypeDto } from '../dto/update-room-type.dto';
import { UpdateRoomTypePipe } from './update-room-type.pipe';

describe('UpdateRoomTypePipe', () => {
  it('success PUBLIC', async () => {
    const target: UpdateRoomTypePipe = new UpdateRoomTypePipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateRoomTypeDto,
      data: '',
    };
    const dto: UpdateRoomTypeDto = {
      roomType: 'PUBLIC',
    };
    expect(target.transform(dto, metadata)).toEqual(dto);
  });

  it('success LOCKED', async () => {
    const target: UpdateRoomTypePipe = new UpdateRoomTypePipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateRoomTypeDto,
      data: '',
    };
    const dto: UpdateRoomTypeDto = {
      roomType: 'LOCKED',
      roomPassword: 'testpass',
    };
    expect(target.transform(dto, metadata)).toEqual(dto);
  });

  it('roomPasswordが必要のないタイプのルームのプロパティにある。', async () => {
    const target: UpdateRoomTypePipe = new UpdateRoomTypePipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateRoomTypeDto,
      data: '',
    };
    const dto: UpdateRoomTypeDto = {
      roomType: 'PUBLIC',
      roomPassword: 'testpassword',
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException(
        'roomPassword is needed when roomType is only "LOCKED"',
        400
      )
    );
  });

  it('roomType LOCKED にroomPasswordがない', async () => {
    const target: UpdateRoomTypePipe = new UpdateRoomTypePipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: UpdateRoomTypeDto,
      data: '',
    };
    const dto: UpdateRoomTypeDto = {
      roomType: 'LOCKED',
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('roomPassword is needed with "LOCKED" roomType', 400)
    );
  });
});
