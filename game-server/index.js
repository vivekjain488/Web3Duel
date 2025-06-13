const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game state management
const activeGames = new Map();
const gameRooms = new Map();

console.log('🎮 Web3Duel Game Server Starting...');

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join a game room
  socket.on('joinGame', (gameData) => {
    const { gameId, playerAddress, gameType } = gameData;
    const roomName = `game-${gameId}`;
    
    socket.join(roomName);
    socket.playerAddress = playerAddress;
    socket.gameId = gameId;
    socket.gameType = gameType;
    
    console.log(`🎯 Player ${playerAddress} joined game ${gameId} (${gameType})`);
    
    if (!activeGames.has(gameId)) {
      activeGames.set(gameId, {
        players: [{ id: socket.id, address: playerAddress }],
        gameType,
        status: 'waiting',
        gameState: initializeGameState(gameType)
      });
    } else {
      const game = activeGames.get(gameId);
      if (game.players.length < 2) {
        game.players.push({ id: socket.id, address: playerAddress });
        
        if (game.players.length === 2) {
          game.status = 'active';
          console.log(`🚀 Game ${gameId} started with 2 players`);
          io.to(roomName).emit('gameStart', {
            gameId,
            players: game.players,
            gameType
          });
        }
      }
    }
    
    socket.emit('joinedGame', { gameId, roomName });
    socket.to(roomName).emit('playerJoined', { gameId, playerAddress });
  });

  // Handle game-specific moves
  socket.on('gameMove', (data) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'active') return;

    const roomName = `game-${data.gameId}`;
    
    switch (socket.gameType) {
      case 'Tic Tac Toe':
        handleTicTacToeMove(data, game, roomName);
        break;
      case 'Number Guessing':
        handleNumberGuessingMove(data, game, roomName);
        break;
      case 'Rock Paper Scissors':
        handleRockPaperScissorsMove(data, game, roomName);
        break;
    }
  });

  // Handle player choices for Rock Paper Scissors
  socket.on('playerChoice', (data) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'active') return;

    const roomName = `game-${data.gameId}`;
    
    if (!game.gameState.currentRound) {
      game.gameState.currentRound = { choices: {}, round: game.gameState.round || 1 };
    }
    
    game.gameState.currentRound.choices[data.player] = data.choice;
    
    socket.to(roomName).emit('opponentMove', { gameId: data.gameId });
    
    // Check if both players have chosen
    const choices = game.gameState.currentRound.choices;
    if (Object.keys(choices).length === 2) {
      const players = Object.keys(choices);
      const [player1Choice, player2Choice] = [choices[players[0]], choices[players[1]]];
      
      let roundWinner = 'tie';
      if (player1Choice !== player2Choice) {
        const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        roundWinner = wins[player1Choice] === player2Choice ? players[0] : players[1];
      }
      
      io.to(roomName).emit('bothPlayersChosen', {
        gameId: data.gameId,
        choices,
        roundWinner
      });
      
      // Reset for next round
      game.gameState.currentRound = null;
    }
  });

  // Handle game initialization
  socket.on('initGame', (data) => {
    const roomName = `game-${data.gameId}`;
    socket.to(roomName).emit('gameInit', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    
    if (socket.gameId) {
      const game = activeGames.get(socket.gameId);
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.id);
        
        if (game.status === 'active' && game.players.length < 2) {
          const roomName = `game-${socket.gameId}`;
          socket.to(roomName).emit('playerDisconnected', {
            gameId: socket.gameId,
            disconnectedPlayer: socket.playerAddress
          });
        }
        
        if (game.players.length === 0) {
          activeGames.delete(socket.gameId);
          console.log(`🗑️ Cleaned up empty game ${socket.gameId}`);
        }
      }
    }
  });
});

function initializeGameState(gameType) {
  switch (gameType) {
    case 'Tic Tac Toe':
      return { board: Array(9).fill(''), currentTurn: null };
    case 'Number Guessing':
      return { targetNumber: null, guesses: [], maxGuesses: 7 };
    case 'Rock Paper Scissors':
      return { scores: {}, round: 1, maxRounds: 5 };
    default:
      return {};
  }
}

function handleTicTacToeMove(data, game, roomName) {
  game.gameState.board = data.board;
  game.gameState.currentTurn = data.nextTurn;
  
  if (data.winner) {
    game.status = 'completed';
    game.winner = data.winner;
  }
  
  io.to(roomName).emit('gameMove', data);
}

function handleNumberGuessingMove(data, game, roomName) {
  game.gameState.guesses = data.guesses;
  
  if (data.winner) {
    game.status = 'completed';
    game.winner = data.winner;
  }
  
  io.to(roomName).emit('gameMove', data);
}

function handleRockPaperScissorsMove(data, game, roomName) {
  game.gameState.scores = data.scores;
  game.gameState.round = data.round;
  
  if (data.winner) {
    game.status = 'completed';
    game.winner = data.winner;
  }
  
  io.to(roomName).emit('gameMove', data);
}

// REST API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Web3Duel Game Server',
    status: 'running',
    activeGames: activeGames.size,
    supportedGames: ['Tic Tac Toe', 'Number Guessing', 'Rock Paper Scissors'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/active-games', (req, res) => {
  const games = Array.from(activeGames.entries()).map(([id, game]) => ({
    id,
    gameType: game.gameType,
    status: game.status,
    playerCount: game.players.length,
    winner: game.winner
  }));
  
  res.json(games);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Game server running on port ${PORT}`);
  console.log(`🎮 Supported games: Tic Tac Toe, Number Guessing, Rock Paper Scissors`);
  console.log(`📊 Visit http://localhost:${PORT} for server status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
  });
});
