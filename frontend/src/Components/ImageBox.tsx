import { Box, BoxProps } from '@mui/material';

type ImgProps = {
  alt: string;
  src: string;
};

export const Img = (props: BoxProps & ImgProps) => (
  <Box component="img" {...props} />
);
