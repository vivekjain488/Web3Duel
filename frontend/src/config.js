// Web3Duel Frontend Configuration
export const config = {
  // Contract Addresses
  TOKEN_CONTRACT_ADDRESS: "0x2139A6A365B7A716ae219Cbd7dD19fd286d3A2c4",
  GAME_CONTRACT_ADDRESS: "0xf47cB5cFB4a6E696C91295a475945C694634B2a5",
  
  // Network Configuration
  NETWORK: {
    chainId: 11155111, // Sepolia
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/your-key"
  },
  
  // Game Configuration
  ENTRY_FEE: "1.0", // W3D tokens
  
  // Game Server
  GAME_SERVER_URL: "http://localhost:3001",
  
  // UI Configuration
  REFRESH_INTERVAL: 30000, // 30 seconds
  
  // Supported Game Types
  GAME_TYPES: [
    'Rock Paper Scissors',
    'Tic Tac Toe', 
    'Number Guessing',
    'Card Game',
    'Trivia Quiz',
    'Memory Game'
  ]
};

export default config; 