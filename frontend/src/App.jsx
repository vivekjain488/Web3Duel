import React, { Suspense, lazy } from 'react';
import { ChakraProvider, Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import theme from './theme';
import { Web3Provider } from './context/Web3Context';

// Lazy load components
const MainApp = lazy(() => import('./components/MainApp'));
const GamePage = lazy(() => import('./pages/GamePage'));

// Loading screen component
const LoadingScreen = () => (
  <Box 
    display="flex" 
    alignItems="center" 
    justifyContent="center" 
    minH="100vh" 
    bg="gray.50"
  >
    <VStack spacing={4}>
      <Spinner size="xl" color="blue.500" />
      <Text fontSize="lg" color="gray.600">Loading Web3Duel...</Text>
    </VStack>
  </Box>
);

function App() {
  console.log('🎮 Web3Duel App Starting...');
  
  try {
    return (
      <ChakraProvider theme={theme}>
        <Web3Provider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/dashboard" element={<MainApp />} />
                <Route path="/game/:gameId" element={<GamePage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </Web3Provider>
      </ChakraProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500">Failed to load app: {error.message}</Text>
      </Box>
    );
  }
}

export default App;