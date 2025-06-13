import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';
import EnhancedGameArena from './EnhancedGameArena';

const PlayGame = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { gameContract, account } = useWeb3();

  useEffect(() => {
    const loadGameData = async () => {
      if (!gameContract || !gameId || !account) return;

      try {
        setLoading(true);
        const game = await gameContract.games(gameId);
        
        const gameInfo = {
          id: gameId,
          player1: game.player1,
          player2: game.player2,
          winner: game.winner,
          claimed: game.claimed,
          gameType: game.gameType,
        };

        // Check if current user is part of this game
        if (gameInfo.player1 !== account && gameInfo.player2 !== account) {
          setError('You are not a participant in this game');
          return;
        }

        // Check if game is ready to play
        if (!gameInfo.player2 || gameInfo.player2 === '0x0000000000000000000000000000000000000000') {
          setError('Waiting for second player to join');
          return;
        }

        // Check if game is already completed
        if (gameInfo.winner && gameInfo.winner !== '0x0000000000000000000000000000000000000000') {
          setError('This game has already been completed');
          return;
        }

        setGameData(gameInfo);
      } catch (error) {
        console.error('Error loading game data:', error);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameContract, gameId, account]);

  const handleGameEnd = (gameId, winner) => {
    console.log('Game ended:', { gameId, winner });
    // Optionally redirect to dashboard after game ends
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 5000);
  };

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading game...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Card maxW="500px">
          <CardBody>
            <VStack spacing={6}>
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
              <Button 
                colorScheme="blue"
                onClick={() => window.location.href = '/dashboard'}
              >
                Return to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }

  if (!gameData) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Card maxW="500px">
          <CardBody>
            <VStack spacing={6}>
              <Heading size="lg">Game Not Found</Heading>
              <Text>The requested game could not be found.</Text>
              <Button 
                colorScheme="blue"
                onClick={() => window.location.href = '/dashboard'}
              >
                Return to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <EnhancedGameArena
        gameId={parseInt(gameId)}
        gameType={gameData.gameType}
        player1={gameData.player1}
        player2={gameData.player2}
        onGameEnd={handleGameEnd}
      />
    </Box>
  );
};

export default PlayGame; 