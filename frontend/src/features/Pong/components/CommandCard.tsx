type Props = {
  text: string;
  onClick: VoidFunction;
};

export const CommandCard = ({ text, onClick }: Props) => {
  return (
    <div
      className="flex h-20 cursor-pointer flex-col justify-start bg-primary p-4 font-bold"
      onClick={onClick}
    >
      <div>
        <p className="text-4xl">{text}</p>
        <div className=" h-1 flex-1 bg-secondary"></div>
      </div>
    </div>
  );
};
