import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Box, Button, VStack, Text, useToast } from '@chakra-ui/react';

const GameList = () => {
  const { gameContract, account } = useWeb3();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!gameContract) return;

    const loadGames = async () => {
      try {
        const gameCount = await gameContract.gameIdCounter();
        const loadedGames = [];

        // Load games in reverse order so newest games appear first
        for (let i = gameCount - 1; i >= 0; i--) {
          const game = await gameContract.games(i);
          loadedGames.push({
            id: i,
            player1: game.player1,
            player2: game.player2,
            winner: game.winner,
            claimed: game.claimed,
            gameType: game.gameType,
          });
        }

        setGames(loadedGames);
      } catch (error) {
        console.error('Error loading games:', error);
      }
    };

    loadGames();
  }, [gameContract]);

  const joinGame = async (gameId) => {
    if (!gameContract || !account) return;

    try {
      setLoading(true);
      const tx = await gameContract.joinGame(gameId);
      await tx.wait();
      toast({
        title: 'Game Joined',
        description: 'You have successfully joined the game!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4}>
      <Text fontSize="xl">Available Games</Text>
      {games.map((game) => (
        <Box key={game.id} p={4} borderWidth={1} borderRadius="md">
          <Text>Game Type: {game.gameType}</Text>
          <Text>Player 1: {game.player1}</Text>
          <Text>Player 2: {game.player2 || 'Waiting for opponent'}</Text>
          {!game.player2 && game.player1 !== account && (
            <Button 
              onClick={() => joinGame(game.id)}
              isLoading={loading}
              loadingText="Joining Game"
            >
              Join Game
            </Button>
          )}
        </Box>
      ))}
    </VStack>
  );
};

export default GameList;
