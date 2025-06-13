import React, { useState, useEffect } from 'react';
import {
  Grid,
  GridItem,
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Avatar,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  SimpleGrid,
  Flex,
  Divider,
  FormControl,
  FormLabel,
  Select,
  Input,
  Progress
} from '@chakra-ui/react';
import { FaPlus, FaGamepad, FaTrophy, FaUsers, FaCoins, FaPlay, FaClock, FaFire } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import config from '../config';

const FullGameDashboard = () => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    activeGames: 0,
    myGames: 0,
    totalPlayers: 0
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState({});
  const [claiming, setClaiming] = useState({});
  
  // Create game modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [gameType, setGameType] = useState('');
  const [step, setStep] = useState(0);
  
  const { gameContract, tokenContract, account, updateTokenBalance } = useWeb3();
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const gameTypes = [...config.GAME_TYPES, 'Custom'];
  const ENTRY_FEE = ethers.parseEther(config.ENTRY_FEE);

  const loadGames = async () => {
    if (!gameContract) return;

    try {
      setLoading(true);
      const gameCount = await gameContract.gameIdCounter();
      const loadedGames = [];

      for (let i = 0; i < gameCount; i++) {
        try {
          const game = await gameContract.games(i);
          loadedGames.push({
            id: i,
            player1: game.player1,
            player2: game.player2,
            winner: game.winner,
            claimed: game.claimed,
            gameType: game.gameType,
          });
        } catch (error) {
          console.error(`Error loading game ${i}:`, error);
        }
      }

      setGames(loadedGames);
      
      // Calculate stats
      const activeGames = loadedGames.filter(g => 
        g.player2 && 
        g.player2 !== '0x0000000000000000000000000000000000000000' && 
        (!g.winner || g.winner === '0x0000000000000000000000000000000000000000')
      ).length;
      
      const myGames = loadedGames.filter(g => 
        account && (g.player1.toLowerCase() === account.toLowerCase() || 
        (g.player2 && g.player2.toLowerCase() === account.toLowerCase()))
      ).length;
      
      const uniquePlayers = new Set();
      loadedGames.forEach(g => {
        uniquePlayers.add(g.player1);
        if (g.player2 && g.player2 !== '0x0000000000000000000000000000000000000000') {
          uniquePlayers.add(g.player2);
        }
      });

      setStats({
        totalGames: loadedGames.length,
        activeGames,
        myGames,
        totalPlayers: uniquePlayers.size
      });
      
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameContract && account) {
      loadGames();
      // Refresh every 30 seconds
      const interval = setInterval(loadGames, 30000);
      return () => clearInterval(interval);
    }
  }, [gameContract, account]);

  const createGame = async () => {
    if (!gameContract || !tokenContract || !account || !gameType) return;

    try {
      setCreating(true);
      setStep(1);

      // Step 1: Check balance
      const balance = await tokenContract.balanceOf(account);
      if (balance < ENTRY_FEE) {
        throw new Error(`Insufficient balance! You need ${config.ENTRY_FEE} W3D`);
      }

      // Step 2: Check and handle allowance
      const currentAllowance = await tokenContract.allowance(account, config.GAME_CONTRACT_ADDRESS);
      if (currentAllowance < ENTRY_FEE) {
        setStep(2);
        const approveAmount = ethers.parseEther("1000");
        const approveTx = await tokenContract.approve(config.GAME_CONTRACT_ADDRESS, approveAmount);
        await approveTx.wait();
      }

      // Step 3: Create game
      setStep(3);
      const tx = await gameContract.createGame(gameType, { gasLimit: 300000 });
      await tx.wait();
      
      toast({
        title: 'Game Created! 🎮',
        description: `Your ${gameType} game is ready for players!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setGameType('');
      updateTokenBalance();
      loadGames();
      onClose();
      
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: 'Game Creation Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
      setStep(0);
    }
  };

  const joinGame = async (gameId) => {
    if (!gameContract || !account) return;

    try {
      setJoining({ ...joining, [gameId]: true });
      const tx = await gameContract.joinGame(gameId, { gasLimit: 300000 });
      await tx.wait();
      
      toast({
        title: 'Game Joined! 🎉',
        description: 'You can now play the game!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      updateTokenBalance();
      loadGames();
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
      setJoining({ ...joining, [gameId]: false });
    }
  };

  const claimPrize = async (gameId) => {
    if (!gameContract || !account) return;

    try {
      setClaiming({ ...claiming, [gameId]: true });
      const tx = await gameContract.claimPrize(gameId, { gasLimit: 300000 });
      await tx.wait();
      
      toast({
        title: 'Prize Claimed! 🏆',
        description: 'You received 2 W3D tokens!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      updateTokenBalance();
      loadGames();
    } catch (error) {
      console.error('Error claiming prize:', error);
      toast({
        title: 'Failed to Claim Prize',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setClaiming({ ...claiming, [gameId]: false });
    }
  };

  const getGameStatus = (game) => {
    if (game.winner && game.winner !== '0x0000000000000000000000000000000000000000') {
      return 'completed';
    }
    if (game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000') {
      return 'active';
    }
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

  const availableGames = games.filter(game => 
    getGameStatus(game) === 'waiting' && game.player1.toLowerCase() !== account?.toLowerCase()
  );
  
  const myGames = games.filter(game => 
    account && (
      game.player1.toLowerCase() === account.toLowerCase() || 
      (game.player2 && game.player2.toLowerCase() === account.toLowerCase())
    )
  );

  const getStepText = () => {
    switch (step) {
      case 1: return 'Checking balance...';
      case 2: return 'Approving tokens...';
      case 3: return 'Creating game...';
      default: return 'Create Game';
    }
  };

  if (!account) {
    return (
      <Card>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            Please connect your wallet to view and create games.
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Platform Stats */}
      <Card bg={cardBg}>
        <CardHeader>
          <HStack>
            <Icon as={FaFire} color="orange.500" />
            <Heading size="md">🎮 Web3Duel Gaming Hub</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat textAlign="center">
              <StatLabel>
                <Icon as={FaGamepad} color="blue.500" mr={1} />
                Total Games
              </StatLabel>
              <StatNumber color="blue.500">{stats.totalGames}</StatNumber>
            </Stat>
            
            <Stat textAlign="center">
              <StatLabel>
                <Icon as={FaPlay} color="green.500" mr={1} />
                Active Games
              </StatLabel>
              <StatNumber color="green.500">{stats.activeGames}</StatNumber>
            </Stat>
            
            <Stat textAlign="center">
              <StatLabel>
                <Icon as={FaUsers} color="purple.500" mr={1} />
                Total Players
              </StatLabel>
              <StatNumber color="purple.500">{stats.totalPlayers}</StatNumber>
            </Stat>
            
            <Stat textAlign="center">
              <StatLabel>
                <Icon as={FaTrophy} color="yellow.500" mr={1} />
                Your Games
              </StatLabel>
              <StatNumber color="yellow.500">{stats.myGames}</StatNumber>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Create Game Section */}
      <Card bg={cardBg}>
        <CardHeader textAlign="center">
          <Button
            size="lg"
            colorScheme="blue"
            leftIcon={<FaPlus />}
            onClick={onOpen}
            w="full"
            py={8}
            fontSize="lg"
          >
            🎮 Create New Game
          </Button>
        </CardHeader>
      </Card>

      {/* Available Games */}
      <Card bg={cardBg}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaClock} color="yellow.500" />
              <Heading size="md">🔥 Available Games</Heading>
            </HStack>
            <Badge colorScheme="yellow">{availableGames.length} waiting</Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : availableGames.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              No games available. Create one to get started! 🚀
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {availableGames.map((game) => (
                <Card key={game.id} borderWidth={2} borderColor="yellow.200">
                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">{game.gameType}</Text>
                      <Badge colorScheme="yellow">WAITING</Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Avatar size="sm" bg="blue.500" />
                        <Text fontSize="sm">
                          Creator: {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
                        </Text>
                      </HStack>
                      <Button
                        colorScheme="yellow"
                        onClick={() => joinGame(game.id)}
                        isLoading={joining[game.id]}
                        loadingText="Joining..."
                        size="lg"
                      >
                        🎯 Join Game (1 W3D)
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* My Games */}
      <Card bg={cardBg}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaGamepad} color="blue.500" />
              <Heading size="md">🎮 My Games</Heading>
            </HStack>
            <Badge colorScheme="blue">{myGames.length} total</Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          {myGames.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              You haven't created or joined any games yet. 🎯
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {myGames.map((game) => {
                const status = getGameStatus(game);
                return (
                  <Card key={game.id} borderWidth={2} borderColor={`${getStatusColor(status)}.200`}>
                    <CardHeader pb={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{game.gameType}</Text>
                        <Badge colorScheme={getStatusColor(status)}>
                          {status.toUpperCase()}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={4} align="stretch">
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
                              <Avatar 
                                size="sm" 
                                bg={(game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000') ? "green.500" : "gray.300"} 
                              />
                              <Text 
                                fontSize="sm" 
                                color={(game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000') ? "inherit" : "gray.500"}
                              >
                                Player 2: {(game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000') ? 
                                  `${game.player2.slice(0, 6)}...${game.player2.slice(-4)}` : 
                                  'Waiting...'
                                }
                              </Text>
                            </HStack>
                            {game.player2 === account && <Badge colorScheme="green">You</Badge>}
                          </HStack>
                        </VStack>

                        {/* Winner Display */}
                        {status === 'completed' && game.winner && game.winner !== '0x0000000000000000000000000000000000000000' && (
                          <HStack justify="center">
                            <Text fontWeight="bold" color="green.500">
                              🏆 Winner: {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
                              {game.winner === account && ' (You!)'}
                            </Text>
                          </HStack>
                        )}

                        {/* Action Buttons */}
                        {status === 'active' && (game.player1 === account || game.player2 === account) && (
                          <Button 
                            colorScheme="green" 
                            onClick={() => window.location.href = `/play/${game.id}`}
                            size="lg"
                          >
                            🎮 Play Game Now!
                          </Button>
                        )}

                        {status === 'completed' && game.winner === account && !game.claimed && (
                          <Button 
                            colorScheme="yellow"
                            onClick={() => claimPrize(game.id)}
                            isLoading={claiming[game.id]}
                            loadingText="Claiming..."
                            size="lg"
                          >
                            🏆 Claim Prize (2 W3D)
                          </Button>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Create Game Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent mx={4}>
          <ModalHeader>
            <HStack>
              <Icon as={FaGamepad} color="blue.500" />
              <Text>Create New Game</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel>Game Type</FormLabel>
                <Select
                  placeholder="Choose a game type"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  bg="white"
                >
                  {gameTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {creating && (
                <Box w="full">
                  <Text fontSize="sm" mb={2} textAlign="center" fontWeight="bold">
                    {getStepText()}
                  </Text>
                  <Progress 
                    value={step === 0 ? 0 : (step / 3) * 100} 
                    colorScheme="blue" 
                    isAnimated 
                    size="lg"
                    borderRadius="md"
                  />
                </Box>
              )}

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text><strong>Entry Fee:</strong> {config.ENTRY_FEE} W3D</Text>
                  <Text><strong>Prize Pool:</strong> {parseFloat(config.ENTRY_FEE) * 2} W3D (Winner takes all)</Text>
                </VStack>
              </Alert>

              <HStack w="full" spacing={4}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                  isDisabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={createGame}
                  isLoading={creating}
                  loadingText={getStepText()}
                  flex={2}
                  isDisabled={!gameType}
                >
                  🎮 Create Game
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default FullGameDashboard; 