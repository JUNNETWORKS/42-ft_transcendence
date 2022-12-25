import { Popover } from '@headlessui/react';
import { Link } from 'react-router-dom';

import { InlineIcon } from '@/hocs/InlineIcon';
import { MenuIcon } from '@/icons';

export const NavDropMenu = () => {
  const links = [
    { to: '/', cap: 'Top' },
    { to: '/pong', cap: 'Pong' },
    { to: '/chat', cap: 'Chat' },
    { to: '/dm', cap: 'DM' },
    { to: '/me', cap: 'Me' },
    { to: '/auth', cap: 'Auth' },
  ];
  return (
    <Popover className="relative">
      <Popover.Button className="outline-none">
        <InlineIcon className="m-5 text-5xl" i={<MenuIcon.Hamburger />} />
      </Popover.Button>

      <Popover.Panel className="absolute z-10">
        <div className="flex w-40 flex-col bg-black text-3xl">
          {links.map((link, i) => {
            return (
              <Popover.Button
                key={i}
                as={Link}
                to={link.to}
                className="mx-2 border-2 border-solid border-white p-1"
              >
                {link.cap}
              </Popover.Button>
            );
          })}
        </div>

        <img src="/solutions.jpg" alt="" />
      </Popover.Panel>
    </Popover>
  );
};
