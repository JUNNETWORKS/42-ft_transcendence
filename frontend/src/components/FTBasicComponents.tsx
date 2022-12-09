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
    onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    /**
     * 日本語変換中でない時にキーが押された時のイベント
     */
    onActualKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  }
) => {
  const [composing, setComposing] = useState(false);
  const onKeyDown = props.onKeyDown;
  const sprops = omit(props, 'onEnter', 'onActualKeyDown', 'className');
  const className = (props.className || '') + ' bg-black';
  return (
    <input
      type="text"
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={() => setComposing(false)}
      className={className}
      {...{ ...sprops }}
      onKeyDown={(e) => {
        if (onKeyDown) {
          onKeyDown(e);
        }
        if (e.key === 'Enter' && !composing) {
          if (props.onEnter) {
            props.onEnter(e);
          }
        }
        if (!composing) {
          if (props.onActualKeyDown) {
            props.onActualKeyDown(e);
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
  props.disabled;
  return (
    <button
      {...{ ...props }}
      className={
        `${
          props.disabled ? '' : 'hover:bg-white hover:text-black'
        } disabled:opacity-50 ` + (props.className || '')
      }
      style={{
        ...(props.style || {}),
        ...styleButtonCommon,
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
      style={{
        ...(props.style || {}),
        ...styleButtonCommon,
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
