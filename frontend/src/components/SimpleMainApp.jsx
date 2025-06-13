import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, VStack, Container } from '@chakra-ui/react';
import Navbar from './Navbar';
import FullGameDashboard from './FullGameDashboard';

// Lazy load components for better performance
const PlayGame = React.lazy(() => import('./PlayGame'));

const SimpleMainApp = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <Suspense 
          fallback={
            <VStack spacing={4} py={20}>
              <Spinner size="xl" color="blue.500" />
              <Box textAlign="center">Loading game...</Box>
            </VStack>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<FullGameDashboard />} />
            <Route path="/play/:gameId" element={<PlayGame />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Container>
    </Box>
  );
};

export default SimpleMainApp; 