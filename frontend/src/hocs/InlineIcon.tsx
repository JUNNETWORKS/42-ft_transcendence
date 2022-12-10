type Props = {
  i: JSX.Element;
  className?: string;
};
export const InlineIcon = ({ i, className }: Props) => {
  return (
    <div className={`inline-block ${className || 'p-1'} align-middle`}>{i}</div>
  );
};
