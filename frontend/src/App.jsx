import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Web3Provider } from './context/Web3Context';
import MainApp from './components/MainApp';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <MainApp />
      </Web3Provider>
    </ChakraProvider>
  );
}

export default App;