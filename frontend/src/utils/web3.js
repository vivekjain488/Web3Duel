// frontend/src/utils/web3.js
import { ethers } from 'ethers';

export const getProvider = () => {
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const getInfuraProvider = () => {
  return new ethers.providers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
  );
};