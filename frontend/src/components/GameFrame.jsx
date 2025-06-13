import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Badge
} from '@chakra-ui/react';
import io from 'socket.io-client';
import TicTacToe from './games/TicTacToe';
import NumberGuessing from './games/NumberGuessing';
import RockPaperScissors from './games/RockPaperScissors';
import { useWeb3 } from '../context/Web3Context';

const GameFrame = ({ game, onGameEnd }) => {
  const [gameStatus, setGameStatus] = useState('waiting');
  const [socket, setSocket] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const { account, gameContract } = useWeb3();
  const toast = useToast();

  // Add safety check for game prop
  if (!game || !game.id) {
    return (
      <VStack justify="center" h="400px" spacing={4}>
        <Alert status="error">
          <AlertIcon />
          Invalid game data
        </Alert>
      </VStack>
    );
  }

  useEffect(() => {
    // Only initialize if we have valid game data
    if (!game || !game.id || !account) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Join game room
    newSocket.emit('joinGame', {
      gameId: game.id,
      playerAddress: account,
      gameType: game.gameType
    });

    newSocket.on('gameStart', (data) => {
      setGameStarted(true);
      setGameStatus('playing');
      toast({
        title: 'Game Started!',
        description: 'Both players are ready. Good luck!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('playerJoined', (data) => {
      toast({
        title: 'Player Joined',
        description: 'Another player has joined the game!',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('playerDisconnected', (data) => {
      toast({
        title: 'Player Disconnected',
        description: 'Your opponent has left the game.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      setGameStatus('waiting');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [game.id, account, toast]);

  const handleGameEnd = async (gameId, winner) => {
    try {
      // Declare winner on blockchain
      if (winner && winner !== 'draw') {
        const tx = await gameContract.declareWinner(gameId, winner);
        await tx.wait();
        
        toast({
          title: 'Game Completed!',
          description: `Winner declared on blockchain: ${winner === account ? 'You won!' : 'Opponent won!'}`,
          status: winner === account ? 'success' : 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      if (onGameEnd) {
        onGameEnd();
      }
    } catch (error) {
      console.error('Error declaring winner:', error);
      toast({
        title: 'Error',
        description: 'Failed to declare winner on blockchain',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderGame = () => {
    if (!gameStarted) {
      return (
        <VStack justify="center" h="400px" spacing={4}>
          <Text fontSize="xl">Waiting for opponent...</Text>
          <Text fontSize="sm" color="gray.500">
            {game.player2 ? 'Both players connected. Game will start soon!' : 'Waiting for second player to join.'}
          </Text>
        </VStack>
      );
    }

    const gameProps = {
      gameId: game.id,
      player1: game.player1,
      player2: game.player2,
      currentPlayer: account,
      onGameEnd: handleGameEnd,
      socket
    };

    switch (game.gameType) {
      case 'Tic Tac Toe':
        return <TicTacToe {...gameProps} />;
      case 'Number Guessing':
        return <NumberGuessing {...gameProps} />;
      case 'Rock Paper Scissors':
        return <RockPaperScissors {...gameProps} />;
      default:
        return (
          <Alert status="error">
            <AlertIcon />
            Unknown game type: {game.gameType}
          </Alert>
        );
    }
  };

  return (
    <VStack spacing={4} h="600px" p={4}>
      {/* Game Info */}
      <HStack w="full" justify="space-between" p={4} bg="gray.50" borderRadius="md">
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">{game.gameType}</Text>
          <Badge colorScheme="blue">Game #{game.id}</Badge>
        </VStack>
        <VStack align="end" spacing={1}>
          <Text fontSize="sm">Prize Pool: 2 W3D</Text>
          <Badge colorScheme={gameStarted ? 'green' : 'yellow'}>
            {gameStarted ? 'Playing' : 'Waiting'}
          </Badge>
        </VStack>
      </HStack>

      {/* Players Info */}
      <HStack w="full" justify="space-between" p={4} bg="gray.50" borderRadius="md">
        <HStack>
          <Badge colorScheme="blue">Player 1</Badge>
          <Text fontSize="sm">
            {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
            {game.player1 === account && ' (You)'}
          </Text>
        </HStack>
        <Text fontWeight="bold">VS</Text>
        <HStack>
          <Badge colorScheme="red">Player 2</Badge>
          <Text fontSize="sm">
            {game.player2 ? 
              `${game.player2.slice(0, 6)}...${game.player2.slice(-4)}${game.player2 === account ? ' (You)' : ''}` : 
              'Waiting...'
            }
          </Text>
        </HStack>
      </HStack>

      {/* Game Area */}
      <Box w="full" flex="1" display="flex" alignItems="center" justifyContent="center">
        {renderGame()}
      </Box>
    </VStack>
  );
};

export default GameFrame;
