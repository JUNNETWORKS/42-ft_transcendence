type HogeTextProps = {
  text: string;
};

export const HogeText = ({ text }: HogeTextProps) => {
  return <div>HogeText is {text}</div>;
};
