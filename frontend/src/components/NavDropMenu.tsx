import { Menu, Transition } from '@headlessui/react';
import { useAtom } from 'jotai';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { InlineIcon } from '@/hocs/InlineIcon';
import { MenuIcon } from '@/icons';
import { chatSocketAtom } from '@/stores/auth';

export const NavDropMenu = () => {
  const [mySocket] = useAtom(chatSocketAtom);

  const links = mySocket
    ? [
        { to: '/', cap: 'Top' },
        { to: '/pong', cap: 'Pong' },
        { to: '/chat', cap: 'Chat' },
        { to: '/dm', cap: 'DM' },
        { to: '/me', cap: 'Me' },
      ]
    : [{ to: '/auth', cap: 'LogIn' }];
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="m-4 rounded-lg p-1 outline-none hover:bg-secondary hover:text-black">
        <InlineIcon className="text-5xl" i={<MenuIcon.Hamburger />} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-20 ml-2 origin-top-left">
          <div className="flex w-36 flex-col bg-black text-3xl">
            {links.map((link, i) => {
              return (
                <Menu.Item
                  key={i}
                  as={Link}
                  to={link.to}
                  className="border-2 border-b-0 border-solid border-white p-2 last:border-b-2 hover:bg-teal-700"
                >
                  {link.cap}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
