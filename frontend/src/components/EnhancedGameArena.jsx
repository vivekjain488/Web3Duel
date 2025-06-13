import React, { useState, useEffect, useRef } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  useToast,
  Spinner,
  Avatar,
  Progress,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FaGamepad, FaClock, FaWifi, FaWifiSlash, FaTrophy } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { useWeb3 } from '../context/Web3Context';
import RockPaperScissors from './games/RockPaperScissors';
import TicTacToe from './games/TicTacToe';
import NumberGuessing from './games/NumberGuessing';

const EnhancedGameArena = ({ gameId, gameType, player1, player2, onGameEnd }) => {
  const [gameState, setGameState] = useState('connecting'); // connecting, waiting, playing, completed
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [gameWinner, setGameWinner] = useState(null);
  const [error, setError] = useState(null);
  const { account, gameContract } = useWeb3();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!account || !gameId) return;

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      timeout: 5000,
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to game server');
      setConnectionStatus('connected');
      setSocket(newSocket);
      socketRef.current = newSocket;

      // Join the game room
      newSocket.emit('joinGame', {
        gameId,
        playerAddress: account,
        gameType
      });
    });

    newSocket.on('joinedGame', (data) => {
      console.log('🎯 Joined game room:', data);
      setGameState('waiting');
      toast({
        title: 'Connected to Game',
        description: 'Waiting for all players to join...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('gameStart', () => {
      console.log('🚀 Game started!');
      setGameState('playing');
    });

    newSocket.on('gameEnd', (data) => {
      console.log('🏁 Game ended:', data);
      setGameWinner(data.winner);
      setGameState('completed');
      
      // Handle blockchain winner declaration
      if (data.winner && data.winner !== 'tie') {
        handleGameComplete(data.winner);
      }
    });

    newSocket.on('playerDisconnected', (data) => {
      toast({
        title: 'Player Disconnected',
        description: 'Your opponent has left the game',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setError('Failed to connect to game server');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      setConnectionStatus('disconnected');
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [account, gameId, gameType]);

  const handleGameComplete = async (winner) => {
    if (!gameContract || !account) return;

    try {
      // Only the winner or game owner can declare the winner
      if (winner === account) {
        const tx = await gameContract.declareWinner(gameId, winner);
        await tx.wait();
        
        toast({
          title: 'Winner Declared!',
          description: 'The game result has been recorded on the blockchain',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        if (onGameEnd) {
          onGameEnd(gameId, winner);
        }
      }
    } catch (error) {
      console.error('Error declaring winner:', error);
      toast({
        title: 'Blockchain Error',
        description: 'Failed to record game result on blockchain',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGameEndFromChild = (gameId, winner) => {
    setGameWinner(winner);
    setGameState('completed');
    handleGameComplete(winner);
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'green.500';
      case 'connecting': return 'yellow.500';
      case 'error': return 'red.500';
      default: return 'gray.500';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return FaWifi;
      case 'error': return FaWifiSlash;
      default: return FaClock;
    }
  };

  const renderGame = () => {
    if (!socket || gameState !== 'playing') return null;

    const gameProps = {
      gameId,
      player1,
      player2,
      currentPlayer: account,
      socket,
      onGameEnd: handleGameEndFromChild
    };

    switch (gameType) {
      case 'Rock Paper Scissors':
        return <RockPaperScissors {...gameProps} />;
      case 'Tic Tac Toe':
        return <TicTacToe {...gameProps} />;
      case 'Number Guessing':
        return <NumberGuessing {...gameProps} />;
      default:
        return (
          <Alert status="error">
            <AlertIcon />
            Unsupported game type: {gameType}
          </Alert>
        );
    }
  };

  const retryConnection = () => {
    setConnectionStatus('connecting');
    setError(null);
    window.location.reload(); // Simple retry mechanism
  };

  if (error) {
    return (
      <Card maxW="600px" mx="auto" mt={8}>
        <CardBody>
          <VStack spacing={6}>
            <Icon as={FaWifiSlash} boxSize={16} color="red.500" />
            <Heading size="lg" color="red.500">Connection Failed</Heading>
            <Text textAlign="center" color="gray.600">
              Unable to connect to the game server. Please check your internet connection and try again.
            </Text>
            <Button colorScheme="blue" onClick={retryConnection}>
              Retry Connection
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} p={6} maxW="900px" mx="auto">
      {/* Connection Status */}
      <Card w="full">
        <CardBody>
          <HStack justify="space-between" align="center">
            <HStack>
              <Icon as={getConnectionIcon()} color={getConnectionColor()} />
              <Text fontWeight="bold">
                Connection: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Text>
            </HStack>
            <HStack>
              <Badge colorScheme="purple" variant="subtle">
                Game #{gameId}
              </Badge>
              <Badge colorScheme="blue">
                {gameType}
              </Badge>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Game Header */}
      <Card w="full">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <VStack align="start">
              <Heading size="lg">{gameType} Arena</Heading>
              <Text color="gray.600">
                {gameState === 'connecting' && 'Connecting to game server...'}
                {gameState === 'waiting' && 'Waiting for all players...'}
                {gameState === 'playing' && 'Game in progress'}
                {gameState === 'completed' && 'Game completed'}
              </Text>
            </VStack>
            <Icon as={FaGamepad} boxSize={12} color="blue.500" />
          </HStack>
        </CardHeader>
      </Card>

      {/* Player Info */}
      <Card w="full">
        <CardBody>
          <HStack justify="space-around" align="center">
            <VStack>
              <Avatar bg="blue.500" size="lg" />
              <VStack spacing={1}>
                <Text fontWeight="bold" fontSize="sm">Player 1</Text>
                <Text fontSize="xs" color="gray.600">
                  {player1.slice(0, 6)}...{player1.slice(-4)}
                </Text>
                {account === player1 && (
                  <Badge colorScheme="blue" size="sm">You</Badge>
                )}
              </VStack>
            </VStack>

            <VStack>
              <Icon as={FaTrophy} boxSize={8} color="yellow.500" />
              <Text fontWeight="bold" fontSize="lg">VS</Text>
              <Text fontSize="sm" color="gray.600">2 W3D Prize Pool</Text>
            </VStack>

            <VStack>
              <Avatar bg="red.500" size="lg" />
              <VStack spacing={1}>
                <Text fontWeight="bold" fontSize="sm">Player 2</Text>
                <Text fontSize="xs" color="gray.600">
                  {player2 ? `${player2.slice(0, 6)}...${player2.slice(-4)}` : 'Waiting...'}
                </Text>
                {account === player2 && (
                  <Badge colorScheme="red" size="sm">You</Badge>
                )}
              </VStack>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Connection Status */}
      {gameState === 'connecting' && (
        <Card w="full">
          <CardBody>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text fontWeight="bold">Connecting to Game Server...</Text>
              <Progress isIndeterminate colorScheme="blue" w="full" />
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Waiting for Players */}
      {gameState === 'waiting' && (
        <Card w="full">
          <CardBody>
            <VStack spacing={4}>
              <Icon as={FaClock} boxSize={12} color="yellow.500" />
              <Text fontWeight="bold" fontSize="lg">Waiting for All Players</Text>
              <Text color="gray.600" textAlign="center">
                {!player2 ? 'Waiting for second player to join...' : 'Both players connected! Game starting soon...'}
              </Text>
              <Progress isIndeterminate colorScheme="yellow" w="full" />
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Game Interface */}
      {gameState === 'playing' && (
        <Box w="full">
          {renderGame()}
        </Box>
      )}

      {/* Game Completed */}
      {gameState === 'completed' && (
        <Card w="full">
          <CardBody>
            <VStack spacing={6}>
              <Icon 
                as={FaTrophy} 
                boxSize={20} 
                color={gameWinner === account ? 'yellow.500' : 'gray.400'} 
              />
              <Heading size="xl" color={gameWinner === account ? 'green.500' : 'red.500'}>
                {gameWinner === account ? '🎉 You Won! 🎉' : 
                 gameWinner === 'tie' ? '🤝 It\'s a Tie! 🤝' : '😔 You Lost 😔'}
              </Heading>
              
              {gameWinner && gameWinner !== 'tie' && (
                <Text fontSize="lg">
                  Winner: {gameWinner === account ? 'You' : 
                    `${gameWinner.slice(0, 6)}...${gameWinner.slice(-4)}`}
                </Text>
              )}

              {gameWinner === account && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Congratulations!</Text>
                    <Text fontSize="sm">
                      You can claim your prize (2 W3D tokens) from the dashboard
                    </Text>
                  </VStack>
                </Alert>
              )}

              {gameWinner === 'tie' && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Game Tied!</Text>
                    <Text fontSize="sm">
                      Both players will receive their entry fee back
                    </Text>
                  </VStack>
                </Alert>
              )}

              <Button 
                colorScheme="blue" 
                onClick={() => window.location.href = '/dashboard'}
                size="lg"
              >
                Return to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Help Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How to Play {gameType}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="start">
              {gameType === 'Rock Paper Scissors' && (
                <>
                  <Text>• Choose Rock, Paper, or Scissors</Text>
                  <Text>• Rock beats Scissors, Scissors beats Paper, Paper beats Rock</Text>
                  <Text>• First player to win 3 rounds wins the game</Text>
                  <Text>• You have 30 seconds per round to make your choice</Text>
                </>
              )}
              
              {gameType === 'Tic Tac Toe' && (
                <>
                  <Text>• Get 3 of your symbols in a row to win</Text>
                  <Text>• Can be horizontal, vertical, or diagonal</Text>
                  <Text>• You have 30 seconds per turn</Text>
                  <Text>• Player 1 is X, Player 2 is O</Text>
                </>
              )}
              
              {gameType === 'Number Guessing' && (
                <>
                  <Text>• First, set a secret number (1-100) for your opponent</Text>
                  <Text>• Then try to guess your opponent's number</Text>
                  <Text>• You get hints: "higher" or "lower" after each guess</Text>
                  <Text>• First to guess correctly wins! Maximum 10 guesses each</Text>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Help Button */}
      <Button variant="outline" onClick={onOpen} size="sm">
        How to Play
      </Button>
    </VStack>
  );
};

export default EnhancedGameArena; 