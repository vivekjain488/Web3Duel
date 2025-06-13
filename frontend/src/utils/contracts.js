import { ethers } from 'ethers';

// Contract addresses from environment
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
const GAME_ADDRESS = import.meta.env.VITE_GAME_CONTRACT_ADDRESS;

// Extended ABI with all necessary functions
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const GAME_ABI = [
  "function gameIdCounter() view returns (uint256)",
  "function entryFee() view returns (uint256)",
  "function token() view returns (address)",
  "function games(uint256) view returns (address player1, address player2, address winner, bool claimed, string gameType)",
  "function createGame(string gameType) returns (uint256)",
  "function joinGame(uint256 gameId)",
  "function declareWinner(uint256 gameId, address winner)",
  "function claimPrize(uint256 gameId)",
  "event GameCreated(uint256 indexed gameId, address indexed player1, string gameType)",
  "event GameJoined(uint256 indexed gameId, address indexed player2)",
  "event WinnerDeclared(uint256 indexed gameId, address indexed winner)",
  "event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount)"
];

export const getTokenContract = (signer) => {
  if (!TOKEN_ADDRESS) {
    console.error('Token contract address not found in environment variables');
    return null;
  }
  return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
};

export const getGameContract = (signer) => {
  if (!GAME_ADDRESS) {
    console.error('Game contract address not found in environment variables');
    return null;
  }
  return new ethers.Contract(GAME_ADDRESS, GAME_ABI, signer);
};

// Helper functions
export const approveTokens = async (tokenContract, spenderAddress, amount) => {
  try {
    const tx = await tokenContract.approve(spenderAddress, amount);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error approving tokens:', error);
    throw error;
  }
};

export const checkAllowance = async (tokenContract, ownerAddress, spenderAddress) => {
  try {
    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
    return allowance;
  } catch (error) {
    console.error('Error checking allowance:', error);
    return ethers.parseEther("0");
  }
};
