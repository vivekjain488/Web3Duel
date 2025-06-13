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
const playerQueues = new Map();

// Game types and their URLs
const gameTypes = {
  'Rock Paper Scissors': 'https://rock-paper-scissors-multiplayer.example.com',
  'Tic Tac Toe': 'https://tic-tac-toe-multiplayer.example.com',
  'Card Game': 'https://card-game-multiplayer.example.com',
  'Puzzle Game': 'https://puzzle-game-multiplayer.example.com',
  'Racing Game': 'https://racing-game-multiplayer.example.com'
};

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
    
    console.log(`🎯 Player ${playerAddress} joined game ${gameId}`);
    
    if (!activeGames.has(gameId)) {
      activeGames.set(gameId, {
        players: [{ id: socket.id, address: playerAddress }],
        gameType,
        status: 'waiting',
        moves: {},
        winner: null
      });
    } else {
      const game = activeGames.get(gameId);
      game.players.push({ id: socket.id, address: playerAddress });
      
      if (game.players.length === 2) {
        game.status = 'active';
        console.log(`🚀 Game ${gameId} started with 2 players`);
        io.to(roomName).emit('gameStart', {
          gameId,
          players: game.players,
          gameUrl: gameTypes[gameType] || 'https://default-game.example.com'
        });
      }
    }
    
    socket.emit('joinedGame', { gameId, roomName });
  });

  // Handle game moves
  socket.on('gameMove', (moveData) => {
    const { gameId, move, playerAddress } = moveData;
    const game = activeGames.get(gameId);
    
    if (game && game.status === 'active') {
      game.moves[playerAddress] = move;
      const roomName = `game-${gameId}`;
      
      console.log(`🎮 Move received from ${playerAddress} in game ${gameId}`);
      
      // Broadcast move to other players
      socket.to(roomName).emit('opponentMove', { move, player: playerAddress });
      
      // Check if both players have made moves (for turn-based games)
      if (Object.keys(game.moves).length === 2) {
        io.to(roomName).emit('allMovesReceived', game.moves);
        game.moves = {}; // Reset for next round
      }
    }
  });

  // Handle game results
  socket.on('gameResult', (resultData) => {
    const { gameId, winner, loser } = resultData;
    const game = activeGames.get(gameId);
    
    if (game && game.status === 'active') {
      game.winner = winner;
      game.status = 'completed';
      const roomName = `game-${gameId}`;
      
      console.log(`🏆 Game ${gameId} completed. Winner: ${winner}`);
      
      io.to(roomName).emit('gameEnd', {
        gameId,
        winner,
        loser,
        timestamp: new Date().toISOString()
      });
      
      // Clean up game after 1 minute
      setTimeout(() => {
        activeGames.delete(gameId);
        console.log(`🗑️ Cleaned up game ${gameId}`);
      }, 60000);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    
    if (socket.gameId) {
      const game = activeGames.get(socket.gameId);
      if (game) {
        // Remove player from game
        game.players = game.players.filter(p => p.id !== socket.id);
        
        // If game was active and player left, end the game
        if (game.status === 'active' && game.players.length < 2) {
          const roomName = `game-${socket.gameId}`;
          socket.to(roomName).emit('playerDisconnected', {
            gameId: socket.gameId,
            disconnectedPlayer: socket.playerAddress
          });
        }
      }
    }
  });
});

// REST API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Web3Duel Game Server',
    status: 'running',
    activeGames: activeGames.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/active-games', (req, res) => {
  const games = Array.from(activeGames.entries()).map(([id, game]) => ({
    id,
    ...game,
    playerCount: game.players.length
  }));
  res.json(games);
});

app.get('/api/game/:id', (req, res) => {
  const gameId = req.params.id;
  const game = activeGames.get(parseInt(gameId));
  
  if (game) {
    res.json({ id: gameId, ...game });
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalGames: activeGames.size,
    activeConnections: io.engine.clientsCount,
    gameTypes: Object.keys(gameTypes),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Game server running on port ${PORT}`);
  console.log(`📊 Visit http://localhost:${PORT} for server status`);
  console.log(`🎮 WebSocket ready for game connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
