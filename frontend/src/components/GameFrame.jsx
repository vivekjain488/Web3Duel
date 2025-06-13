import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  Select,
  useToast
} from '@chakra-ui/react';

const GameFrame = ({ gameUrl, gameId, player1, player2, currentPlayer, onGameEnd }) => {
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const toast = useToast();

  // Simulate game timer
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Game timeout
      handleGameTimeout();
    }
  }, [gameStatus, timeLeft]);

  const startGame = () => {
    setGameStatus('playing');
    toast({
      title: 'Game Started!',
      description: 'Good luck!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const declareWinner = () => {
    if (winner && onGameEnd) {
      onGameEnd(gameId, winner);
      setGameStatus('completed');
    }
  };

  const handleGameTimeout = () => {
    setGameStatus('completed');
    toast({
      title: 'Game Timeout',
      description: 'Game ended due to timeout',
      status: 'warning',
      duration: 5000,
      isClosable: true,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <VStack spacing={4} h="600px">
      {/* Game Info */}
      <HStack w="full" justify="space-between" p={4} bg="gray.50" borderRadius="md">
        <Text fontWeight="bold">
          Player 1: {player1.slice(0, 6)}...{player1.slice(-4)}
          {player1 === currentPlayer && ' (You)'}
        </Text>
        <Text fontWeight="bold">VS</Text>
        <Text fontWeight="bold">
          Player 2: {player2.slice(0, 6)}...{player2.slice(-4)}
          {player2 === currentPlayer && ' (You)'}
        </Text>
      </HStack>

      {/* Game Timer */}
      {gameStatus === 'playing' && (
        <Alert status="info">
          <AlertIcon />
          Time remaining: {formatTime(timeLeft)}
        </Alert>
      )}

      {/* Game Frame */}
      <Box w="full" h="400px" border="1px" borderColor="gray.200" borderRadius="md">
        {gameStatus === 'waiting' ? (
          <VStack justify="center" h="full" spacing={4}>
            <Text fontSize="xl">Ready to play?</Text>
            <Button colorScheme="blue" onClick={startGame}>
              Start Game
            </Button>
          </VStack>
        ) : gameStatus === 'playing' ? (
          <iframe
            src={gameUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: '6px' }}
            allow="fullscreen"
            title={`Game ${gameId}`}
          />
        ) : (
          <VStack justify="center" h="full" spacing={4}>
            <Text fontSize="xl" color="green.500">
              Game Completed!
            </Text>
            {winner && (
              <Text>
                Winner: {winner.slice(0, 6)}...{winner.slice(-4)}
              </Text>
            )}
          </VStack>
        )}
      </Box>

      {/* Game Controls */}
      {gameStatus === 'playing' && (
        <VStack spacing={4} w="full">
          <HStack spacing={4} w="full">
            <Select
              placeholder="Declare winner..."
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
            >
              <option value={player1}>
                Player 1: {player1.slice(0, 6)}...{player1.slice(-4)}
              </option>
              <option value={player2}>
                Player 2: {player2.slice(0, 6)}...{player2.slice(-4)}
              </option>
            </Select>
            <Button
              colorScheme="green"
              onClick={declareWinner}
              isDisabled={!winner}
            >
              Declare Winner
            </Button>
          </HStack>
          
          <Text fontSize="sm" color="gray.600" textAlign="center">
            In a real implementation, the game result would be determined automatically
            by the game iframe or through smart contract integration.
          </Text>
        </VStack>
      )}
    </VStack>
  );
};

export default GameFrame;
