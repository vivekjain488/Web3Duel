import React, { useEffect } from 'react';
import {
  HStack,
  Text,
  Icon,
  Badge,
  Skeleton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaCoins } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';

const TokenBalance = () => {
  const { tokenBalance, account, updateTokenBalance } = useWeb3();
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (account) {
      updateTokenBalance();
      const interval = setInterval(updateTokenBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [account]);

  if (!account) {
    return null;
  }

  return (
    <HStack spacing={2}>
      <Icon as={FaCoins} color="yellow.500" />
      <Text fontSize="sm" color={textColor}>
        Balance:
      </Text>
      <Skeleton isLoaded={true}>
        <Badge colorScheme="yellow" fontSize="sm">
          {parseFloat(tokenBalance).toFixed(2)} W3D
        </Badge>
      </Skeleton>
    </HStack>
  );
};

export default TokenBalance;
