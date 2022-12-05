import { useState } from 'react';

import { omit } from '@/utils';

import {
  styleTextFieldCommon,
  styleH3,
  styleH4,
  styleButtonCommon,
} from './styles';

export const FTTextField = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {
    /**
     * 日本語変換中でない時にenterキーが押された時のイベント
     */
    onEnter?: () => void;
  }
) => {
  const [composing, setComposing] = useState(false);
  const onKeyDown = props.onKeyDown;
  const sprops = omit(props, 'onEnter');
  return (
    <input
      type="text"
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={() => setComposing(false)}
      {...{ ...sprops }}
      onKeyDown={(e) => {
        if (onKeyDown) {
          onKeyDown(e);
        }
        if (e.key === 'Enter' && !composing) {
          if (props.onEnter) {
            props.onEnter();
          }
        }
      }}
      style={{
        ...(props.style || {}),
        ...styleTextFieldCommon,
      }}
    />
  );
};

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
        (props.className || '') +
        ' border-[2px] border-solid border-white py-[2px] px-[6px]' +
        ' hover:bg-white hover:text-black disabled:opacity-50'
      }
      style={{
        ...(props.style || {}),
      }}
    />
  );
};

export const FTSubmit = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
) => {
  return (
    <input
      {...{ ...props }}
      type="submit"
      className={
        (props.className || '') +
        ' border-[2px] border-solid border-white py-[2px] px-[6px]'
      }
      style={{
        ...(props.style || {}),
      }}
    />
  );
};

export const FTH1 = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => {
  return (
    <h1
      {...{ ...props }}
      style={{
        ...styleH3,
        ...(props.style || {}),
      }}
    />
  );
};

export const FTH2 = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => {
  return (
    <h2
      {...{ ...props }}
      style={{
        ...styleH3,
        ...(props.style || {}),
      }}
    />
  );
};

export const FTH3 = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => {
  return (
    <h3
      {...{ ...props }}
      style={{
        ...styleH3,
        ...(props.style || {}),
      }}
    />
  );
};

export const FTH4 = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => {
  return (
    <h4
      {...{ ...props }}
      style={{
        ...styleH4,
        ...(props.style || {}),
      }}
    />
  );
};
