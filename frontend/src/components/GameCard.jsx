import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Avatar,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';

const GameCard = ({ game, onGameUpdate, isMyGame = false }) => {
  const [isJoining, setIsJoining] = useState(false);
  const { gameContract, account, updateTokenBalance } = useWeb3();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const joinGame = async () => {
    if (!gameContract || !account) return;

    try {
      setIsJoining(true);
      const tx = await gameContract.joinGame(game.id);
      await tx.wait();
      
      toast({
        title: 'Game Joined!',
        description: 'You have successfully joined the game!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      updateTokenBalance();
      onGameUpdate();
      onClose();
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Failed to Join',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getGameStatus = () => {
    if (game.winner) return 'completed';
    if (game.player2) return 'active';
    return 'waiting';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'active': return 'blue';
      case 'waiting': return 'yellow';
      default: return 'gray';
    }
  };

  const status = getGameStatus();

  return (
    <>
      <Card bg={cardBg} borderWidth={2} borderColor={isMyGame ? 'blue.200' : 'transparent'}>
        <CardHeader pb={2}>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="lg">
              {game.gameType}
            </Text>
            <Badge colorScheme={getStatusColor(status)}>
              {status.toUpperCase()}
            </Badge>
          </HStack>
        </CardHeader>
        
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {/* Players */}
            <VStack spacing={2}>
              <HStack w="full" justify="space-between">
                <HStack>
                  <Avatar size="sm" bg="blue.500" />
                  <Text fontSize="sm">
                    Player 1: {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
                  </Text>
                </HStack>
                {game.player1 === account && <Badge colorScheme="blue">You</Badge>}
              </HStack>
              
              <HStack w="full" justify="space-between">
                <HStack>
                  <Avatar size="sm" bg={game.player2 ? "green.500" : "gray.300"} />
                  <Text fontSize="sm" color={game.player2 ? "inherit" : "gray.500"}>
                    Player 2: {game.player2 ? 
                      `${game.player2.slice(0, 6)}...${game.player2.slice(-4)}` : 
                      'Waiting...'
                    }
                  </Text>
                </HStack>
                {game.player2 === account && <Badge colorScheme="green">You</Badge>}
              </HStack>
            </VStack>

            {/* Winner Display */}
            {game.winner && (
              <HStack justify="center">
                <Text fontWeight="bold" color="green.500">
                  Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                  {game.winner === account && ' (You!)'}
                </Text>
              </HStack>
            )}

            {/* Actions */}
            {!game.player2 && game.player1 !== account && account && (
              <Button
                colorScheme="blue"
                onClick={onOpen}
                isDisabled={!account}
              >
                Join Game (1 W3D)
              </Button>
            )}

            {game.player2 && !game.winner && (
              <Button colorScheme="green" isDisabled>
                Game in Progress
              </Button>
            )}

            {game.winner && game.winner === account && !game.claimed && (
              <Button colorScheme="yellow">
                Claim Prize (2 W3D)
              </Button>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Join Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Join Game
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to join this game? This will cost 1 W3D token.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={joinGame}
                isLoading={isJoining}
                loadingText="Joining..."
                ml={3}
              >
                Join Game
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GameCard;
