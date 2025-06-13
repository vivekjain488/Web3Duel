import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Container,
  Flex,
  Icon,
  Badge,
  useColorMode,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FaGamepad, FaTrophy, FaCoins, FaUsers, FaChartLine } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import WalletConnect from './WalletConnect';
import TokenBalance from './TokenBalance';
import GameDashboard from './GameDashboard';
import GameArena from './GameArena';
import Leaderboard from './Leaderboard';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { colorMode, toggleColorMode } = useColorMode();
  const { account, isConnecting, error } = useWeb3();
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaGamepad },
    { id: 'arena', label: 'Game Arena', icon: FaTrophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: FaUsers },
  ];

  const renderContent = () => {
    if (isConnecting) {
      return (
        <Box textAlign="center" py={20}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>Connecting to your wallet...</Text>
        </Box>
      );
    }

    if (!account) {
      return (
        <Box textAlign="center" py={20}>
          <VStack spacing={6}>
            <Icon as={FaGamepad} boxSize={20} color="blue.500" />
            <Heading size="lg">Welcome to Web3Duel!</Heading>
            <Text color="gray.600" fontSize="lg" maxW="md">
              The ultimate blockchain gaming platform. Connect your wallet to start playing and earning!
            </Text>
            <WalletConnect />
          </VStack>
        </Box>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <GameDashboard />;
      case 'arena':
        return <GameArena />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <GameDashboard />;
    }
  };

  return (
    <Box minH="100vh" bg={bg}>
      {/* Header */}
      <Box bg={cardBg} boxShadow="lg" position="sticky" top="0" zIndex="1000" borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Icon as={FaGamepad} color="blue.500" boxSize={10} />
              <VStack spacing={0} align="start">
                <Heading size="lg" color="blue.500">
                  Web3Duel
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Blockchain Gaming Platform
                </Text>
              </VStack>
              <Badge colorScheme="green" variant="solid" px={3} py={1}>
                LIVE
              </Badge>
            </HStack>
            
            <HStack spacing={4}>
              {account && <TokenBalance />}
              <Button onClick={toggleColorMode} variant="ghost" size="md">
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>
              <WalletConnect />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Error Display */}
      {error && (
        <Container maxW="container.xl" pt={4}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      )}

      {/* Navigation */}
      {account && (
        <Box bg={cardBg} borderBottom="1px" borderColor="gray.200">
          <Container maxW="container.xl">
            <HStack spacing={0}>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  leftIcon={<Icon as={tab.icon} />}
                  colorScheme={activeTab === tab.id ? 'blue' : 'gray'}
                  bg={activeTab === tab.id ? 'blue.50' : 'transparent'}
                  color={activeTab === tab.id ? 'blue.600' : 'gray.600'}
                  borderRadius="none"
                  py={6}
                  px={8}
                  fontSize="md"
                  fontWeight={activeTab === tab.id ? 'bold' : 'normal'}
                  borderBottom={activeTab === tab.id ? '3px solid' : '3px solid transparent'}
                  borderBottomColor={activeTab === tab.id ? 'blue.500' : 'transparent'}
                  _hover={{
                    bg: activeTab === tab.id ? 'blue.50' : 'gray.50',
                    color: activeTab === tab.id ? 'blue.600' : 'gray.800'
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </HStack>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {renderContent()}
      </Container>

      {/* Footer */}
      <Box bg={cardBg} borderTop="1px" borderColor="gray.200" py={8} mt={20}>
        <Container maxW="container.xl">
          <VStack spacing={4}>
            <HStack spacing={8}>
              <HStack>
                <Icon as={FaGamepad} color="blue.500" />
                <Text fontSize="sm" color="gray.600">Powered by Blockchain</Text>
              </HStack>
              <HStack>
                <Icon as={FaCoins} color="yellow.500" />
                <Text fontSize="sm" color="gray.600">W3D Token</Text>
              </HStack>
              <HStack>
                <Icon as={FaChartLine} color="green.500" />
                <Text fontSize="sm" color="gray.600">Fair Gaming</Text>
              </HStack>
            </HStack>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              © 2024 Web3Duel. Built with ❤️ for the gaming community.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default MainApp;
