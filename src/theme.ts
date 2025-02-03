import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      500: '#0967D2', // Primary
      600: '#0552B5', // Hover
      700: '#03449E', // Active
    },
  },
});

export default theme; 