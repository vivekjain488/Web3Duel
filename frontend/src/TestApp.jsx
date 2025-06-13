import React from 'react';
import { ChakraProvider, Box, Text, Heading, Button } from '@chakra-ui/react';

function TestApp() {
  return (
    <ChakraProvider>
      <Box p={8} bg="gray.50" minH="100vh">
        <Heading color="blue.500" mb={4}>
          🎮 Web3Duel Test Page
        </Heading>
        <Text mb={4}>
          If you can see this, React and Chakra UI are working correctly!
        </Text>
        <Button colorScheme="blue">
          Test Button
        </Button>
      </Box>
    </ChakraProvider>
  );
}

export default TestApp; 