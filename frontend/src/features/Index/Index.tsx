import { Link } from 'react-router-dom';

export const Index = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex h-full max-h-[100%] w-full flex-col items-center overflow-y-auto p-0">
        <div className="flex flex-1 flex-col items-center justify-center gap-32">
          <h1 className="text-8xl font-bold">ft_pong</h1>
          <div className="flex flex-col gap-6">
            <p className="text-5xl font-bold">
              <Link to="/pong">Start</Link>
            </p>
            <p className="text-5xl font-bold">
              <Link to="/me">Profile</Link>
            </p>
            <p className="text-5xl font-bold">
              <Link to="/chat">Social</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
