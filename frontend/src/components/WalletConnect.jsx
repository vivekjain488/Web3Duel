import React from 'react';
import {
  Button,
  Text,
  VStack,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  CloseButton
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useWeb3 } from '../context/Web3Context';

const WalletConnect = () => {
  const { account, connectWallet, isConnecting, network, error, disconnect } = useWeb3();
  const bgColor = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${account?.slice(0, 6)}...${account?.slice(-4)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else if (error) {
      toast({
        title: 'Connection Failed',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!account) {
    return (
      <VStack spacing={2}>
        {error && (
          <Alert status="error" borderRadius="md" fontSize="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Button
          colorScheme="blue"
          onClick={handleConnect}
          isLoading={isConnecting}
          loadingText="Connecting..."
          size="md"
        >
          Connect Wallet
        </Button>
      </VStack>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        bg={bgColor}
        variant="outline"
      >
        <HStack spacing={2}>
          <Avatar size="sm" bg="blue.500" />
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="bold">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Text>
            <Badge colorScheme="green" fontSize="xs">
              {network?.name || 'Connected'}
            </Badge>
          </VStack>
        </HStack>
      </MenuButton>
      <MenuList>
        <MenuItem>View Profile</MenuItem>
        <MenuItem>Transaction History</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuItem onClick={disconnect}>
          Disconnect
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default WalletConnect;
