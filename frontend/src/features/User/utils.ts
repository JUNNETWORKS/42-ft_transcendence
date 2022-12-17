import { User } from '@/typedef';

const activeTimeMs = 60 * 1000;

type OnlineStatus = 'Playing' | 'Online' | 'Away' | 'Offline';

export function getOnlineStatus(user: User): OnlineStatus {
  if (user) {
    if (user.ongoingMatchId) {
      return 'Playing';
    }
    if (user.pulseTime) {
      if (Date.now() - user.pulseTime.getTime() < activeTimeMs) {
        return 'Online';
      } else {
        return 'Away';
      }
    }
  }
  return 'Offline';
}

export function getOnlineStatusColor(user: User) {
  const status = getOnlineStatus(user);
  switch (status) {
    case 'Playing':
      return 'text-blue-500';
    case 'Online':
      return 'text-green-500';
    case 'Away':
      return 'text-orange-500';
    case 'Offline':
      return 'text-slate-500';
  }
}
