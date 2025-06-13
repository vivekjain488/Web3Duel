import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenContract, getGameContract } from '../utils/contracts.js';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not found. Please install MetaMask to use this application');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setAccount(accounts[0].address);
      setNetwork(network);
      
      const signer = await provider.getSigner();
      const tokenContract = getTokenContract(signer);
      const gameContract = getGameContract(signer);
      
      setTokenContract(tokenContract);
      setGameContract(gameContract);
      
      // Get token balance
      if (tokenContract) {
        try {
          const balance = await tokenContract.balanceOf(accounts[0].address);
          setTokenBalance(ethers.formatEther(balance));
        } catch (balanceError) {
          console.log('Could not fetch token balance:', balanceError);
          setTokenBalance('0');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const updateTokenBalance = async () => {
    if (tokenContract && account) {
      try {
        const balance = await tokenContract.balanceOf(account);
        setTokenBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setTokenContract(null);
    setGameContract(null);
    setTokenBalance('0');
    setNetwork(null);
    setError(null);
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            setProvider(provider);
            setAccount(accounts[0].address);
            
            const signer = await provider.getSigner();
            const tokenContract = getTokenContract(signer);
            const gameContract = getGameContract(signer);
            
            setTokenContract(tokenContract);
            setGameContract(gameContract);
            
            // Get network
            const network = await provider.getNetwork();
            setNetwork(network);

            // Get token balance
            if (tokenContract) {
              try {
                const balance = await tokenContract.balanceOf(accounts[0].address);
                setTokenBalance(ethers.formatEther(balance));
              } catch (balanceError) {
                console.log('Could not fetch token balance:', balanceError);
                setTokenBalance('0');
              }
            }
          }

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
              disconnect();
            } else {
              setAccount(accounts[0]);
              // Refresh contracts and balance
              window.location.reload();
            }
          });

          // Listen for network changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        } catch (error) {
          console.error('Error initializing Web3:', error);
        }
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{
      account,
      provider,
      tokenContract,
      gameContract,
      tokenBalance,
      isConnecting,
      network,
      error,
      connectWallet,
      updateTokenBalance,
      disconnect
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
