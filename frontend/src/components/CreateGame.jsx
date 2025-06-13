import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  Progress,
  Box,
  Select,
  Textarea,
  Badge,
  Icon,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FaGamepad, FaCoins, FaTrophy, FaUsers } from 'react-icons/fa';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import config from '../config.js';

const CreateGame = ({ onGameCreated }) => {
  const [gameType, setGameType] = useState('');
  const [customGameType, setCustomGameType] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(0);
  const [userStats, setUserStats] = useState({ balance: '0', allowance: '0', entryFee: '1' });
  const { gameContract, tokenContract, account, updateTokenBalance } = useWeb3();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const gameTypes = [
    'Tic Tac Toe',
    'Number Guessing',
    'Rock Paper Scissors'
  ];

  const ENTRY_FEE = ethers.parseEther(config.ENTRY_FEE);
  const GAME_ADDRESS = config.GAME_CONTRACT_ADDRESS;

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!tokenContract || !gameContract || !account) return;

      try {
        const balance = await tokenContract.balanceOf(account);
        const allowance = await tokenContract.allowance(account, GAME_ADDRESS);
        const entryFee = await gameContract.entryFee();

        setUserStats({
          balance: ethers.formatEther(balance),
          allowance: ethers.formatEther(allowance),
          entryFee: ethers.formatEther(entryFee)
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [tokenContract, gameContract, account]);

  const createGame = async () => {
    if (!gameContract || !tokenContract || !account) {
      toast({
        title: 'Wallet Error',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const finalGameType = gameType === 'Custom' ? customGameType : gameType;
    
    if (!finalGameType.trim()) {
      toast({
        title: 'Game Type Required',
        description: 'Please select or enter a game type',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsCreating(true);
      setStep(1);

      // Step 1: Check balance
      const balance = await tokenContract.balanceOf(account);
      if (balance < ENTRY_FEE) {
        throw new Error(`Insufficient balance! You need ${ethers.formatEther(ENTRY_FEE)} W3D but only have ${ethers.formatEther(balance)} W3D`);
      }

      // Step 2: Check and handle allowance
      const currentAllowance = await tokenContract.allowance(account, GAME_ADDRESS);
      if (currentAllowance < ENTRY_FEE) {
        setStep(2);
        toast({
          title: 'Approval Required',
          description: 'Approving tokens for game creation...',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        const approveAmount = ethers.parseEther("1000"); // Approve for multiple games
        const approveTx = await tokenContract.approve(GAME_ADDRESS, approveAmount);
        await approveTx.wait();
        
        toast({
          title: 'Tokens Approved! 🎉',
          description: 'You can now create games without additional approvals',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // Step 3: Create game
      setStep(3);
      const tx = await gameContract.createGame(finalGameType, {
        gasLimit: 300000
      });
      
      toast({
        title: 'Transaction Sent 🚀',
        description: 'Creating your game on the blockchain...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Game Created Successfully! 🎮',
        description: `Your ${finalGameType} game is ready for players!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setGameType('');
      setCustomGameType('');
      setDescription('');
      
      // Update balance and notify parent
      updateTokenBalance();
      if (onGameCreated) {
        onGameCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating game:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('Insufficient balance')) {
        errorMessage = error.message;
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction failed. Please check your token balance and try again.';
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      toast({
        title: 'Game Creation Failed ❌',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
      setStep(0);
    }
  };

  const getStepText = () => {
    switch (step) {
      case 1: return 'Checking balance...';
      case 2: return 'Approving tokens...';
      case 3: return 'Creating game...';
      default: return 'Create Game';
    }
  };

  const canCreateGame = parseFloat(userStats.balance) >= parseFloat(userStats.entryFee);

  if (!account) {
    return (
      <Card bg="blue.50" borderColor="blue.200" borderWidth={2}>
        <CardBody textAlign="center" py={8}>
          <Icon as={FaGamepad} boxSize={12} color="blue.500" mb={4} />
          <Heading size="md" color="blue.600" mb={2}>Ready to Create Games?</Heading>
          <Text color="blue.600">Connect your wallet to start creating amazing games!</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Quick Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Stat bg="white" p={4} borderRadius="md" borderWidth={1}>
          <StatLabel>
            <HStack>
              <Icon as={FaCoins} color="yellow.500" />
              <Text>Your Balance</Text>
            </HStack>
          </StatLabel>
          <StatNumber color={canCreateGame ? 'green.500' : 'red.500'}>
            {parseFloat(userStats.balance).toFixed(2)} W3D
          </StatNumber>
          <StatHelpText>
            {canCreateGame ? 'Ready to play!' : 'Need more tokens'}
          </StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" borderWidth={1}>
          <StatLabel>
            <HStack>
              <Icon as={FaTrophy} color="blue.500" />
              <Text>Entry Fee</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{userStats.entryFee} W3D</StatNumber>
          <StatHelpText>Winner takes {parseFloat(userStats.entryFee) * 2} W3D</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" borderWidth={1}>
          <StatLabel>
            <HStack>
              <Icon as={FaUsers} color="green.500" />
              <Text>Allowance</Text>
            </HStack>
          </StatLabel>
          <StatNumber color={parseFloat(userStats.allowance) >= parseFloat(userStats.entryFee) ? 'green.500' : 'orange.500'}>
            {parseFloat(userStats.allowance).toFixed(2)} W3D
          </StatNumber>
          <StatHelpText>
            {parseFloat(userStats.allowance) >= parseFloat(userStats.entryFee) ? 'Approved' : 'Needs approval'}
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Create Game Button */}
      <Card>
        <CardHeader textAlign="center">
          <Button
            size="lg"
            colorScheme="blue"
            leftIcon={<FaGamepad />}
            onClick={onOpen}
            isDisabled={!canCreateGame}
            w="full"
            py={8}
            fontSize="lg"
          >
            {canCreateGame ? 'Create New Game' : 'Insufficient Balance'}
          </Button>
          {!canCreateGame && (
            <Text fontSize="sm" color="red.500" mt={2}>
              You need at least {userStats.entryFee} W3D tokens to create a game
            </Text>
          )}
        </CardHeader>
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
              {/* Game Type Selection */}
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

              {/* Custom Game Type */}
              {gameType === 'Custom' && (
                <FormControl>
                  <FormLabel>Custom Game Name</FormLabel>
                  <Input
                    placeholder="Enter your custom game name"
                    value={customGameType}
                    onChange={(e) => setCustomGameType(e.target.value)}
                    bg="white"
                  />
                </FormControl>
              )}

              {/* Game Description */}
              <FormControl>
                <FormLabel>Game Description (Optional)</FormLabel>
                <Textarea
                  placeholder="Describe your game or add special rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  bg="white"
                  rows={3}
                />
              </FormControl>

              <Divider />

              {/* Progress Indicator */}
              {isCreating && (
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
                  <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                    Step {step} of 3
                  </Text>
                </Box>
              )}

              {/* Game Info */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text><strong>Entry Fee:</strong> {userStats.entryFee} W3D</Text>
                  <Text><strong>Prize Pool:</strong> {parseFloat(userStats.entryFee) * 2} W3D (Winner takes all)</Text>
                  <Text><strong>Your Balance:</strong> {parseFloat(userStats.balance).toFixed(2)} W3D</Text>
                </VStack>
              </Alert>

              {/* Action Buttons */}
              <HStack w="full" spacing={4}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                  isDisabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={createGame}
                  isLoading={isCreating}
                  loadingText={getStepText()}
                  flex={2}
                  isDisabled={!gameType || (gameType === 'Custom' && !customGameType.trim())}
                >
                  {isCreating ? getStepText() : 'Create Game'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateGame;
