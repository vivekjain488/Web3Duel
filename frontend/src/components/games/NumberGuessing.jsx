import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Input,
  Alert,
  AlertIcon,
  Badge,
  Progress
} from '@chakra-ui/react';

const NumberGuessing = ({ gameId, player1, player2, currentPlayer, onGameEnd, socket }) => {
  const [targetNumber, setTargetNumber] = useState(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [maxGuesses] = useState(7);

  useEffect(() => {
    // Initialize game with random number (1-100)
    if (currentPlayer === player1) {
      const number = Math.floor(Math.random() * 100) + 1;
      setTargetNumber(number);
      if (socket) {
        socket.emit('initGame', { gameId, targetNumber: number });
      }
    }

    if (socket) {
      socket.on('gameInit', (data) => {
        if (data.gameId === gameId) {
          setTargetNumber(data.targetNumber);
        }
      });

      socket.on('gameMove', (data) => {
        if (data.gameId === gameId) {
          setGuesses(data.guesses);
          if (data.winner) {
            setWinner(data.winner);
            setGameStatus('completed');
            onGameEnd(gameId, data.winner);
          }
        }
      });
    }
  }, [socket, gameId, currentPlayer, player1, onGameEnd]);

  const makeGuess = () => {
    const guess = parseInt(currentGuess);
    if (!guess || guess < 1 || guess > 100) return;

    const newGuess = {
      player: currentPlayer,
      number: guess,
      result: guess === targetNumber ? 'correct' : guess < targetNumber ? 'higher' : 'lower'
    };

    const newGuesses = [...guesses, newGuess];
    let gameWinner = null;

    if (guess === targetNumber) {
      gameWinner = currentPlayer;
    } else if (newGuesses.length >= maxGuesses) {
      // Game over, no winner (or closest wins)
      gameWinner = 'draw';
    }

    if (socket) {
      socket.emit('gameMove', {
        gameId,
        guesses: newGuesses,
        winner: gameWinner
      });
    }

    setGuesses(newGuesses);
    setCurrentGuess('');

    if (gameWinner) {
      setWinner(gameWinner);
      setGameStatus('completed');
      onGameEnd(gameId, gameWinner);
    }
  };

  return (
    <VStack spacing={4} w="full" maxW="400px">
      <Text fontSize="xl" fontWeight="bold">Guess the Number (1-100)</Text>
      
      <Progress 
        value={(guesses.length / maxGuesses) * 100} 
        w="full" 
        colorScheme="blue"
      />
      
      <Text>Guesses: {guesses.length}/{maxGuesses}</Text>

      {winner && (
        <Alert status={winner === currentPlayer ? 'success' : winner === 'draw' ? 'info' : 'error'}>
          <AlertIcon />
          {winner === 'draw' ? 'Game Over - No Winner!' : 
           winner === currentPlayer ? 'You Won! 🎉' : 'You Lost!'}
          <Text ml={2}>The number was: {targetNumber}</Text>
        </Alert>
      )}

      <HStack w="full">
        <Input
          placeholder="Enter your guess"
          value={currentGuess}
          onChange={(e) => setCurrentGuess(e.target.value)}
          type="number"
          min="1"
          max="100"
          isDisabled={gameStatus !== 'playing'}
        />
        <Button 
          onClick={makeGuess}
          isDisabled={gameStatus !== 'playing' || !currentGuess}
          colorScheme="blue"
        >
          Guess
        </Button>
      </HStack>

      <VStack spacing={2} w="full" maxH="200px" overflowY="auto">
        {guesses.map((guess, index) => (
          <HStack key={index} justify="space-between" w="full" p={2} bg="gray.50" borderRadius="md">
            <Badge colorScheme={guess.player === player1 ? 'blue' : 'red'}>
              {guess.player === currentPlayer ? 'You' : 'Opponent'}
            </Badge>
            <Text>{guess.number}</Text>
            <Badge colorScheme={
              guess.result === 'correct' ? 'green' : 
              guess.result === 'higher' ? 'orange' : 'purple'
            }>
              {guess.result === 'correct' ? '🎯 Correct!' : 
               guess.result === 'higher' ? '⬆️ Higher' : '⬇️ Lower'}
            </Badge>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default NumberGuessing;