type Prop = {
  onClick: () => void;
  title: string;
  num: number;
};

export const NumberButton = ({ onClick, title, num }: Prop) => {
  return (
    <div
      className="flex cursor-pointer items-center border-2 border-white bg-white"
      onClick={onClick}
    >
      <div className="flex min-w-[5em] shrink grow flex-row items-center justify-center self-stretch bg-white text-center font-bold text-black">
        <p>{title}</p>
      </div>
      <div className="min-w-[2em] shrink-0 grow-0 bg-black px-2 text-center font-bold">
        {num}
      </div>
    </div>
  );
};
