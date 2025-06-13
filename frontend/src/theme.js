import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C7',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'blue' ? 'blue.500' : `${props.colorScheme}.500`,
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'blue' ? 'blue.600' : `${props.colorScheme}.600`,
          },
        }),
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'lg',
          bg: 'white',
          _dark: {
            bg: 'gray.800',
          },
        },
      },
    },
  },
});

export default theme;
