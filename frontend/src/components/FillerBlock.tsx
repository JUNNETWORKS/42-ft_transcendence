import { ReactNode } from 'react';

type Prop = {
  icon?: (props: { className: string }) => JSX.Element;
  message?: string;
  children?: ReactNode;
};

export const FillerBlock = ({ icon, message, children }: Prop) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {Icon && (
        <div>
          <Icon className="block text-5xl" />
        </div>
      )}
      {message && <p className="text-xl">{message}</p>}
      {children}
    </div>
  );
};
