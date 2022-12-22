import { PickType, PartialType } from '@nestjs/swagger';

import { PostMessageDto } from './post-message.dto';

export class UpdateMessageDto extends PartialType(
  PickType(PostMessageDto, [
    'matchId',
    'secondaryUserId',
    'subpayload',
  ] as const)
) {}
