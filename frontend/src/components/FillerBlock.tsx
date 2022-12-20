type Prop = {
  icon?: (props: { className: string }) => JSX.Element;
  message?: string;
};

export const FillerBlock = ({ icon, message }: Prop) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {Icon && (
        <div>
          <Icon className="block text-5xl" />
        </div>
      )}
      {message && <p className="text-xl">{message}</p>}
    </div>
  );
};
