import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export function SelectListBox<T extends string>(props: {
  selected: T;
  items: T[];
  setItem: (t: T) => void;
  makeText?: (t: T) => string;
  makeElement?: (t: T) => JSX.Element;
}) {
  const makeElement =
    props.makeElement ||
    ((t: T) => <>{props.makeText ? props.makeText(t) : t}</>);
  return (
    <>
      <Listbox value={props.selected} onChange={props.setItem}>
        <div className="relative">
          <Listbox.Button className="relative w-[9em]  border-2 px-2 text-center">
            {makeElement(props.selected)}
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 w-full overflow-auto border-2 border-solid border-white bg-black">
              {props.items.map((item) => (
                <Listbox.Option
                  className="cursor-pointer bg-black p-[2px] text-center hover:bg-teal-800"
                  key={item}
                  value={item}
                >
                  {makeElement(item)}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </>
  );
}
