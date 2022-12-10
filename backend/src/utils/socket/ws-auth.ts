import { User } from '@prisma/client';
import { Socket } from 'socket.io';

export function getUserFromClient(client: Socket) {
  return (client as any).handshake.user as User;
}
