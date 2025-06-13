import React, { useState, useEffect } from 'react';
import {
  Grid,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

const TicTacToe = ({ gameId, player1, player2, currentPlayer, onGameEnd, socket }) => {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [currentTurn, setCurrentTurn] = useState(player1);
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);

  const isMyTurn = currentTurn === currentPlayer;
  const mySymbol = currentPlayer === player1 ? 'X' : 'O';

  useEffect(() => {
    if (socket) {
      socket.on('gameMove', (data) => {
        if (data.gameId === gameId) {
          setBoard(data.board);
          setCurrentTurn(data.nextTurn);
          if (data.winner) {
            setWinner(data.winner);
            setGameStatus('completed');
            onGameEnd(gameId, data.winner);
          }
        }
      });
    }
  }, [socket, gameId, onGameEnd]);

  const checkWinner = (newBoard) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a] === 'X' ? player1 : player2;
      }
    }

    if (newBoard.every(cell => cell !== '')) {
      return 'draw';
    }

    return null;
  };

  const makeMove = (index) => {
    if (!isMyTurn || board[index] || gameStatus !== 'playing') return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    
    const gameWinner = checkWinner(newBoard);
    const nextTurn = currentTurn === player1 ? player2 : player1;

    if (socket) {
      socket.emit('gameMove', {
        gameId,
        board: newBoard,
        nextTurn: gameWinner ? null : nextTurn,
        winner: gameWinner
      });
    }

    setBoard(newBoard);
    
    if (gameWinner) {
      setWinner(gameWinner);
      setGameStatus('completed');
      onGameEnd(gameId, gameWinner);
    } else {
      setCurrentTurn(nextTurn);
    }
  };

  return (
    <VStack spacing={4}>
      <HStack justify="space-between" w="full">
        <Badge colorScheme={currentPlayer === player1 ? 'blue' : 'red'}>
          You are {mySymbol}
        </Badge>
        <Text fontWeight="bold">
          {gameStatus === 'playing' ? 
            (isMyTurn ? 'Your Turn' : 'Opponent\'s Turn') : 
            'Game Over'
          }
        </Text>
      </HStack>

      {winner && (
        <Alert status={winner === currentPlayer ? 'success' : winner === 'draw' ? 'info' : 'error'}>
          <AlertIcon />
          {winner === 'draw' ? 'Game Draw!' : 
           winner === currentPlayer ? 'You Won! 🎉' : 'You Lost!'}
        </Alert>
      )}

      <Grid templateColumns="repeat(3, 1fr)" gap={2} w="300px" h="300px">
        {board.map((cell, index) => (
          <Button
            key={index}
            h="90px"
            fontSize="2xl"
            fontWeight="bold"
            onClick={() => makeMove(index)}
            isDisabled={!isMyTurn || cell || gameStatus !== 'playing'}
            colorScheme={cell === 'X' ? 'blue' : cell === 'O' ? 'red' : 'gray'}
            variant={cell ? 'solid' : 'outline'}
          >
            {cell}
          </Button>
        ))}
      </Grid>
    </VStack>
  );
};

export default TicTacToe;