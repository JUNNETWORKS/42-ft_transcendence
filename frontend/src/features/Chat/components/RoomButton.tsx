import { styleButtonCommon } from '@/components/styles';

export const FTButton = (
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  return (
    <button
      {...{ ...props }}
      className={
        'hover:bg-white hover:text-black disabled:opacity-50 ' +
        (props.className || '')
      }
      style={{
        ...(props.style || {}),
        ...styleButtonCommon,
      }}
    />
  );
};
