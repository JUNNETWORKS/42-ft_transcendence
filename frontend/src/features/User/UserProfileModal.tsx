export const UserProfileModal = () => {
  return (
    <div className="flex w-[420px] flex-col justify-around gap-5 p-8">
      <div className="flex gap-8">
        <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" />
        <div className="flex flex-col justify-around">
          <p className="text-2xl">Id: Hoge0102</p>
          <p className="text-2xl">Name:totaisei</p>
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <p className="flex h-10 w-20 items-center justify-center bg-secondary">
          編集
        </p>
        <p className="flex h-10 w-20 items-center justify-center bg-secondary">
          保存
        </p>
      </div>
    </div>
  );
};
