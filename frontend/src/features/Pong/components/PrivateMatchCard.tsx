import { useAtom } from 'jotai';
import { useState } from 'react';

import {
  FTBlockedHeader,
  FTButton,
  FTNumberField,
} from '@/components/FTBasicComponents';
import { SelectListBox } from '@/components/SelectListBox';
import { makeCommand } from '@/features/Chat/command';
import {
  GameSpeedFactor,
  GameSpeedFactors,
} from '@/features/User/types/MatchResult';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { chatSocketAtom } from '@/stores/auth';
import { ChatRoom } from '@/typedef';

import { privateMatchErrors } from '../private_match.validator';

type Prop = {
  room: ChatRoom;
  onSucceeded: () => void;
  onCancel: () => void;
};

export const PrivateMatchCard = ({ room, onSucceeded, onCancel }: Prop) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [fetchState, setFetchState] = useState<'Neutral' | 'Fetching'>(
    'Neutral'
  );
  const [maxScoreStr, setMaxScoreStr] = useState('15');
  const [gameSpeedFactorStr, setGameSpeedFactorStr] =
    useState<GameSpeedFactor>('x100');
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  if (!mySocket) {
    return null;
  }
  const maxScore = parseInt(maxScoreStr);
  const command = makeCommand(mySocket, room.id);
  const submit = async () => {
    if (fetchState === 'Fetching') {
      return;
    }
    setFetchState('Fetching');
    try {
      const result = await command.pong_private_match_create(room.id, {
        maxScore,
        speed: gameSpeedFactorStr,
      });
      console.log('result', result);
      onSucceeded();
    } catch (e) {
      if (e instanceof TypeError) {
        // ネットワークエラー
      } else {
        const ne = e as any;
        if (ne.status === 'rejected' && typeof ne.errors === 'object') {
          setNetErrors(ne.errors);
        }
      }
    }
    setFetchState('Neutral');
  };

  const validationErrors = privateMatchErrors(maxScoreStr);
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
            <div className="text-red-400">
              {validationErrors.maxScoreStr || netErrors.maxScore || '　'}
            </div>
          </div>
        </div>
        <div className="flex flex-row">
          <div className="basis-[8em] p-2">ボールスピード</div>
          <div className="z-10 flex shrink-0 grow-0 items-center">
            <SelectListBox<GameSpeedFactor>
              selected={gameSpeedFactorStr}
              items={[...GameSpeedFactors]}
              setItem={setGameSpeedFactorStr}
              makeElement={(t) => {
                return (
                  <div className="flex flex-row justify-center">
                    <p>x</p>
                    <p className="basis-[2.5em]">{GameSpeedFactor[t]}</p>
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
          onClick={submit}
          disabled={validationErrors.some || fetchState === 'Fetching'}
        >
          <InlineIcon i={<Icons.Pong.Game />} />
          作成！！
        </FTButton>
      </div>
    </div>
  );
};
