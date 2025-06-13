import React from 'react';
import { Card, CardBody, CardHeader, Text, Heading, Icon, VStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';

const Leaderboard = () => {
  return (
    <Card>
      <CardHeader textAlign="center">
        <VStack spacing={4}>
          <Icon as={FaUsers} boxSize={16} color="purple.500" />
          <Heading size="lg">Leaderboard</Heading>
        </VStack>
      </CardHeader>
      <CardBody textAlign="center">
        <Text color="gray.600" fontSize="lg">
          🏆 Coming Soon! 🏆
        </Text>
        <Text color="gray.500" mt={2}>
          See who's dominating the Web3Duel arena!
        </Text>
      </CardBody>
    </Card>
  );
};

export default Leaderboard;
