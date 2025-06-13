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
  Divider
} from '@chakra-ui/react';
import { FaPlus, FaGamepad, FaTrophy, FaUsers, FaCoins, FaPlay, FaClock, FaFire } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import CreateGame from './CreateGame';
import GameCard from './GameCard';

const GameDashboard = () => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    activeGames: 0,
    myGames: 0,
    totalPlayers: 0
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { gameContract, account, tokenContract } = useWeb3();
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
      const activeGames = loadedGames.filter(g => g.player2 && g.player2 !== '0x0000000000000000000000000000000000000000' && !g.winner).length;
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
    if (gameContract) {
      loadGames();
      // Refresh every 30 seconds
      const interval = setInterval(loadGames, 30000);
      return () => clearInterval(interval);
    }
  }, [gameContract, account]);

  const availableGames = games.filter(game => 
    !game.player2 || game.player2 === '0x0000000000000000000000000000000000000000'
  );
  
  const myGames = games.filter(game => 
    account && (
      game.player1.toLowerCase() === account.toLowerCase() || 
      (game.player2 && game.player2.toLowerCase() === account.toLowerCase())
    )
  );

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
            <Heading size="md">Platform Statistics</Heading>
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
      <CreateGame onGameCreated={loadGames} />

      {/* Available Games */}
      <Card bg={cardBg}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaClock} color="yellow.500" />
              <Heading size="md">Available Games</Heading>
              <Badge colorScheme="yellow">{availableGames.length}</Badge>
            </HStack>
            <Button onClick={loadGames} size="sm" variant="outline" isLoading={loading}>
              Refresh
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          {loading ? (
            <HStack justify="center" py={8}>
              <Spinner color="blue.500" />
              <Text>Loading games...</Text>
            </HStack>
          ) : availableGames.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">No games waiting for players</Text>
                <Text fontSize="sm">Create a new game to get started!</Text>
              </VStack>
            </Alert>
          ) : (
            <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={4}>
              {availableGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </Grid>
          )}
        </CardBody>
      </Card>

      {/* My Games */}
      {account && (
        <Card bg={cardBg}>
          <CardHeader>
            <HStack>
              <Icon as={FaUsers} color="purple.500" />
              <Heading size="md">My Games</Heading>
              <Badge colorScheme="purple">{myGames.length}</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            {myGames.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">You haven't joined any games yet</Text>
                  <Text fontSize="sm">Join an available game or create your own!</Text>
                </VStack>
              </Alert>
            ) : (
              <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={4}>
                {myGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </Grid>
            )}
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default GameDashboard;
