import { useState } from 'react';

import {
  FTBlockedHeader,
  FTButton,
  FTNumberField,
} from '@/components/FTBasicComponents';
import { SelectListBox } from '@/components/SelectListBox';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { ChatRoom } from '@/typedef';

import { privateMatchErrors } from '../private_match.validator';

const gameSpeedFactors = ['x050', 'x100', 'x125', 'x150'] as const;
type GameSpeedFactor = typeof gameSpeedFactors[number];
const gameSpeedFactor = {
  x050: 0.5,
  x100: 1.0,
  x125: 1.25,
  x150: 1.5,
};

type Prop = {
  room: ChatRoom;
  onSucceeded: () => void;
  onCancel: () => void;
};

export const PrivateMatchCard = ({ room, onSucceeded, onCancel }: Prop) => {
  const [maxScoreStr, setMaxScoreStr] = useState('15');
  const [gameSpeedFactorStr, setGameSpeedFactorStr] =
    useState<GameSpeedFactor>('x100');
  const errors = privateMatchErrors(maxScoreStr);
  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTBlockedHeader>
        <FTButton onClick={onCancel} className="shrink-0 grow-0">
          <Icons.Cancel className="block" />
        </FTButton>
        <div className="shrink-0 grow-0">プライベートマッチ作成</div>
      </FTBlockedHeader>
      <div className="p-2">
        <div className="flex flex-row">
          <div className="basis-[8em] p-2">マッチポイント</div>
          <div className="shrink grow items-center">
            <FTNumberField
              className="border-2"
              autoComplete="off"
              placeholder=""
              min={1}
              max={100}
              step={1}
              value={maxScoreStr}
              onChange={(e) => setMaxScoreStr(e.target.value)}
            />
            <div>{errors.maxScoreStr || '　'}</div>
          </div>
        </div>
        <div className="flex flex-row">
          <div className="basis-[8em] p-2">ボールスピード</div>
          <div className="z-10 flex shrink-0 grow-0 items-center">
            <SelectListBox<GameSpeedFactor>
              selected={gameSpeedFactorStr}
              items={[...gameSpeedFactors]}
              setItem={setGameSpeedFactorStr}
              makeElement={(t) => {
                return (
                  <div className="flex flex-row justify-center">
                    <p>x</p>
                    <p className="basis-[2.5em]">{gameSpeedFactor[t]}</p>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-2">
        <FTButton className="mr-2" onClick={onCancel}>
          Cancel
        </FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          onClick={onSucceeded}
          disabled={errors.some}
        >
          <InlineIcon i={<Icons.Pong.Game />} />
          作成！！
        </FTButton>
      </div>
    </div>
  );
};
