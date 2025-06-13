import React from 'react';
import { Card, CardBody, CardHeader, Text, Heading, Icon, VStack } from '@chakra-ui/react';
import { FaTrophy } from 'react-icons/fa';

const GameArena = () => {
  return (
    <Card>
      <CardHeader textAlign="center">
        <VStack spacing={4}>
          <Icon as={FaTrophy} boxSize={16} color="yellow.500" />
          <Heading size="lg">Game Arena</Heading>
        </VStack>
      </CardHeader>
      <CardBody textAlign="center">
        <Text color="gray.600" fontSize="lg">
          🚧 Coming Soon! 🚧
        </Text>
        <Text color="gray.500" mt={2}>
          The ultimate gaming experience is being built for you!
        </Text>
      </CardBody>
    </Card>
  );
};

export default GameArena;
