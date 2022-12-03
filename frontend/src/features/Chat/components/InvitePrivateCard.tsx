import { FTButton } from '@/components/FTBasicComponents';

export const InvitePrivateCard = () => {
  // TODO: リストアップするユーザーを取得する
  // TODO: ユーザーをListboxとかで一覧表示する（このとき自分を表示しない）
  // TODO: ページング実装（[<-], [->]みたいなボタンで）
  // TODO: 実行者が選択したユーザーをft_inviteで投げる
  // TODO: ft_inviteのレスポンスを表示する

  return (
    <div className="flex flex-row">
      <div className="shrink-0 grow-0">
        <FTButton onClick={() => ({})}>招待</FTButton>
      </div>
    </div>
  );
};
