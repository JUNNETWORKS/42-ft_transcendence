type Props = {
  i: JSX.Element;
};
export const InlineIcon = ({ i }: Props) => {
  return <div className="inline-block p-1 align-middle">{i}</div>;
};
