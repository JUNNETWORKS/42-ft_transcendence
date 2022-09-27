import { createTheme } from '@mui/material/styles';

export const Theme = createTheme({
  palette: {
    primary: {
      main: '#353535',
    },
    secondary: {
      main: '#5E5E5E',
    },
  },
  typography: {
    fontFamily: ['PixelMplus'].join(','),
  },
});
