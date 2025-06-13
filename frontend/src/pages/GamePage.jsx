import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Spinner, 
  Alert, 
  AlertIcon, 
  Button, 
  HStack, 
  VStack,
  Text 
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';
import GameFrame from '../components/GameFrame';

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { gameContract, account } = useWeb3();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGame();
  }, [gameId, gameContract]);

  const loadGame = async () => {
    if (!gameContract || !gameId) {
      setError('Game contract not available or invalid game ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Parse gameId to ensure it's a valid number
      const parsedGameId = parseInt(gameId);
      if (isNaN(parsedGameId) || parsedGameId < 0) {
        throw new Error('Invalid game ID format');
      }
      
      // Check if game exists by checking game counter first
      const gameCounter = await gameContract.gameIdCounter();
      if (parsedGameId >= gameCounter) {
        throw new Error('Game does not exist');
      }
      
      const gameData = await gameContract.games(parsedGameId);
      
      // Validate game data
      if (!gameData || !gameData.player1 || gameData.player1 === '0x0000000000000000000000000000000000000000') {
        throw new Error('Game not found or invalid');
      }
      
      setGame({
        id: parsedGameId,
        player1: gameData.player1,
        player2: gameData.player2,
        winner: gameData.winner,
        claimed: gameData.claimed,
        gameType: gameData.gameType
      });
    } catch (error) {
      console.error('Error loading game:', error);
      setError(error.message || 'Game not found or error loading game data');
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = () => {
    // Refresh game data and navigate back to dashboard after a delay
    loadGame();
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading game...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
          <HStack>
            <Button onClick={() => navigate('/dashboard')} colorScheme="blue">
              Back to Dashboard
            </Button>
            <Button onClick={loadGame} variant="outline">
              Try Again
            </Button>
          </HStack>
        </VStack>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Alert status="warning">
            <AlertIcon />
            Game not found
          </Alert>
          <Button onClick={() => navigate('/dashboard')} colorScheme="blue">
            Back to Dashboard
          </Button>
        </VStack>
      </Container>
    );
  }

  // Check if user is part of this game
  const isPlayer = account && (
    game.player1.toLowerCase() === account.toLowerCase() || 
    (game.player2 && game.player2.toLowerCase() === account.toLowerCase())
  );

  if (!isPlayer) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Alert status="warning">
            <AlertIcon />
            You are not a player in this game.
          </Alert>
          <Button onClick={() => navigate('/dashboard')} colorScheme="blue">
            Back to Dashboard
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={4}>
        <HStack w="full" justify="space-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
          <Button size="sm" onClick={loadGame} variant="ghost">
            Refresh Game
          </Button>
        </HStack>
        <GameFrame game={game} onGameEnd={handleGameEnd} />
      </VStack>
    </Container>
  );
};

export default GamePage;