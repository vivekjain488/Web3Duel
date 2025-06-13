import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Alert,
  AlertIcon,
  Badge,
  Icon,
  Box
} from '@chakra-ui/react';
import { FaHandRock, FaHandPaper, FaHandScissors } from 'react-icons/fa';

const RockPaperScissors = ({ gameId, player1, player2, currentPlayer, onGameEnd, socket }) => {
  const [myChoice, setMyChoice] = useState('');
  const [opponentChoice, setOpponentChoice] = useState('');
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ [player1]: 0, [player2]: 0 });
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [roundResult, setRoundResult] = useState('');

  const choices = [
    { name: 'rock', icon: FaHandRock, color: 'gray' },
    { name: 'paper', icon: FaHandPaper, color: 'blue' },
    { name: 'scissors', icon: FaHandScissors, color: 'orange' }
  ];

  useEffect(() => {
    if (socket) {
      socket.on('gameMove', (data) => {
        if (data.gameId === gameId) {
          setScores(data.scores);
          setRound(data.round);
          setRoundResult(data.roundResult);
          setMyChoice('');
          setOpponentChoice('');
          setWaitingForOpponent(false);
          
          if (data.winner) {
            setWinner(data.winner);
            setGameStatus('completed');
            onGameEnd(gameId, data.winner);
          }
        }
      });

      socket.on('opponentMove', (data) => {
        if (data.gameId === gameId) {
          setOpponentChoice('waiting');
        }
      });
    }
  }, [socket, gameId, onGameEnd]);

  const getWinner = (choice1, choice2) => {
    if (choice1 === choice2) return 'tie';
    
    const wins = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };
    
    return wins[choice1] === choice2 ? 'player1' : 'player2';
  };

  const makeChoice = (choice) => {
    if (myChoice || gameStatus !== 'playing') return;

    setMyChoice(choice);
    setWaitingForOpponent(true);

    if (socket) {
      socket.emit('playerChoice', {
        gameId,
        player: currentPlayer,
        choice
      });
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('bothPlayersChosen', (data) => {
        if (data.gameId === gameId) {
          const { choices, roundWinner } = data;
          const newScores = { ...scores };
          
          if (roundWinner !== 'tie') {
            newScores[roundWinner]++;
          }

          let gameWinner = null;
          let result = '';

          if (roundWinner === 'tie') {
            result = 'Round Tie!';
          } else if (roundWinner === currentPlayer) {
            result = 'You won this round!';
          } else {
            result = 'Opponent won this round!';
          }

          // Best of 5 rounds
          if (newScores[player1] === 3 || newScores[player2] === 3 || round >= 5) {
            if (newScores[player1] > newScores[player2]) {
              gameWinner = player1;
            } else if (newScores[player2] > newScores[player1]) {
              gameWinner = player2;
            } else {
              gameWinner = 'draw';
            }
          }

          if (socket) {
            socket.emit('gameMove', {
              gameId,
              scores: newScores,
              round: round + 1,
              roundResult: result,
              winner: gameWinner
            });
          }
        }
      });
    }
  }, [socket, gameId, scores, round, currentPlayer, player1, player2]);

  const getChoiceIcon = (choice) => {
    const choiceData = choices.find(c => c.name === choice);
    return choiceData ? choiceData.icon : null;
  };

  return (
    <VStack spacing={6} w="full" maxW="400px">
      <Text fontSize="xl" fontWeight="bold">Rock Paper Scissors</Text>
      
      <HStack justify="space-between" w="full">
        <Badge colorScheme="blue">Round {round}/5</Badge>
        <HStack spacing={4}>
          <Text>You: {scores[currentPlayer]}</Text>
          <Text>Opponent: {scores[currentPlayer === player1 ? player2 : player1]}</Text>
        </HStack>
      </HStack>

      {roundResult && (
        <Alert status={roundResult.includes('You won') ? 'success' : roundResult.includes('Tie') ? 'info' : 'error'}>
          <AlertIcon />
          {roundResult}
        </Alert>
      )}

      {winner && (
        <Alert status={winner === currentPlayer ? 'success' : winner === 'draw' ? 'info' : 'error'}>
          <AlertIcon />
          {winner === 'draw' ? 'Game Draw!' : 
           winner === currentPlayer ? 'You Won the Game! 🎉' : 'You Lost the Game!'}
        </Alert>
      )}

      {gameStatus === 'playing' && (
        <VStack spacing={4}>
          <Text fontWeight="bold">
            {waitingForOpponent ? 'Waiting for opponent...' : 'Choose your move:'}
          </Text>
          
          <HStack spacing={4}>
            {choices.map((choice) => (
              <Button
                key={choice.name}
                size="lg"
                h="80px"
                w="80px"
                onClick={() => makeChoice(choice.name)}
                isDisabled={waitingForOpponent || myChoice}
                colorScheme={myChoice === choice.name ? choice.color : 'gray'}
                variant={myChoice === choice.name ? 'solid' : 'outline'}
              >
                <Icon as={choice.icon} boxSize={8} />
              </Button>
            ))}
          </HStack>

          {myChoice && (
            <HStack spacing={4} align="center">
              <Box textAlign="center">
                <Text fontSize="sm">Your Choice</Text>
                <Icon as={getChoiceIcon(myChoice)} boxSize={6} />
              </Box>
              <Text fontSize="xl">VS</Text>
              <Box textAlign="center">
                <Text fontSize="sm">Opponent</Text>
                <Text fontSize="2xl">{opponentChoice ? '?' : '⏳'}</Text>
              </Box>
            </HStack>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default RockPaperScissors;