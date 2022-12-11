import { Link, useLocation } from 'react-router-dom';

export const Switcher = () => {
  const location = useLocation();
  const [feature] = location.pathname.split('/').filter((w) => !!w);
  const modes = [
    { label: 'Chat', path: 'chat' },
    { label: 'DM', path: 'dm' },
  ];
  const switches = modes.map((m) => {
    const className =
      'block shrink grow basis-[50%] border-0 border-b-2 border-r-2 border-solid border-white p-1 text-center last:border-r-0';
    const isIn = m.path === feature;
    if (isIn) {
      return (
        <div
          key={m.path}
          className={`${className} bg-white font-bold text-black`}
        >
          {m.label}
        </div>
      );
    } else {
      return (
        <Link
          key={m.path}
          className={`${className} hover:bg-gray-300 hover:text-black`}
          to={`/${m.path}`}
        >
          {m.label}
        </Link>
      );
    }
  });

  return (
    <div className="flex w-full shrink-0 grow-0 flex-row justify-items-stretch text-xl">
      {switches}
    </div>
  );
};
