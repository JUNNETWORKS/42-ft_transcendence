import { useEffect, useState, useMemo } from 'react';
import { styleTextFieldCommon, styleH3, styleH4 } from './styles';

export const FTTextField = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
) => {
  return (
    <input
      type="text"
      {...{ ...props }}
      style={{
        ...(props.style || {}),
        ...styleTextFieldCommon,
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
        ...(props.style || {}),
        ...styleH3,
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
        ...(props.style || {}),
        ...styleH4,
      }}
    />
  );
};
