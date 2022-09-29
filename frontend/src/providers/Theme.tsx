import { createTheme } from '@mui/material/styles';

export const Theme = createTheme({
  palette: {
    primary: {
      main: '#353535',
    },
    secondary: {
      main: '#5E5E5E',
    },
    background: {
      default: '#000000',
    },
    text: {
      primary: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: ['PixelMplus'].join(','),
  },
});
