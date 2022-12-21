import { isfinite } from 'src/utils';

const GameSpeedFactors = ['x050', 'x100', 'x125', 'x150'] as const;
type GameSpeedFactor = typeof GameSpeedFactors[number];
const GameSpeedFactor = {
  x050: 0.5,
  x100: 1.0,
  x125: 1.25,
  x150: 1.5,
};

export type PongPrivateMatchCreateDTO = {
  roomId: number;
  speed: GameSpeedFactor;
  maxScore: number;
};

export function gameSpeedFactorToGameSpeed(factor: GameSpeedFactor) {
  const speed = GameSpeedFactor[factor] || null;
  if (isfinite(speed)) {
    return speed * 100;
  }
  return speed;
}
