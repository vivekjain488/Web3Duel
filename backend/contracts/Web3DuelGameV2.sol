// backend/contracts/Web3DuelGameV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Web3DuelGameV2 is Ownable {
    IERC20 public token;
    uint256 public entryFee;

    struct Game {
        address player1;
        address player2;
        address winner;
        bool claimed;
        string gameType;
    }

    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;

    event GameCreated(uint256 indexed gameId, address indexed player1, string gameType);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event WinnerDeclared(uint256 indexed gameId, address indexed winner);
    event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount);

    // Custom errors for better debugging
    error InsufficientBalance(uint256 required, uint256 available);
    error InsufficientAllowance(uint256 required, uint256 available);
    error GameFull();
    error CannotJoinOwnGame();
    error WinnerAlreadyDeclared();
    error InvalidWinner();
    error NotWinner();
    error PrizeAlreadyClaimed();
    error TransferFailed();

    constructor(address _token, uint256 _entryFee) Ownable(msg.sender) {
        token = IERC20(_token);
        entryFee = _entryFee;
    }

    function createGame(string memory gameType) external {
        // Check balance
        uint256 balance = token.balanceOf(msg.sender);
        if (balance < entryFee) {
            revert InsufficientBalance(entryFee, balance);
        }
        
        // Check allowance
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < entryFee) {
            revert InsufficientAllowance(entryFee, allowance);
        }
        
        // Transfer tokens
        bool success = token.transferFrom(msg.sender, address(this), entryFee);
        if (!success) {
            revert TransferFailed();
        }
        
        games[gameIdCounter] = Game(msg.sender, address(0), address(0), false, gameType);
        emit GameCreated(gameIdCounter, msg.sender, gameType);
        gameIdCounter++;
    }

    function joinGame(uint256 gameId) external {
        Game storage g = games[gameId];
        
        if (g.player2 != address(0)) {
            revert GameFull();
        }
        
        if (msg.sender == g.player1) {
            revert CannotJoinOwnGame();
        }
        
        // Check balance and allowance
        uint256 balance = token.balanceOf(msg.sender);
        if (balance < entryFee) {
            revert InsufficientBalance(entryFee, balance);
        }
        
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < entryFee) {
            revert InsufficientAllowance(entryFee, allowance);
        }
        
        bool success = token.transferFrom(msg.sender, address(this), entryFee);
        if (!success) {
            revert TransferFailed();
        }
        
        g.player2 = msg.sender;
        emit GameJoined(gameId, msg.sender);
    }

    function declareWinner(uint256 gameId, address winner) external onlyOwner {
        Game storage g = games[gameId];
        
        if (g.winner != address(0)) {
            revert WinnerAlreadyDeclared();
        }
        
        if (winner != g.player1 && winner != g.player2) {
            revert InvalidWinner();
        }
        
        g.winner = winner;
        emit WinnerDeclared(gameId, winner);
    }

    function claimPrize(uint256 gameId) external {
        Game storage g = games[gameId];
        
        if (msg.sender != g.winner) {
            revert NotWinner();
        }
        
        if (g.claimed) {
            revert PrizeAlreadyClaimed();
        }
        
        g.claimed = true;
        uint256 prize = entryFee * 2;
        
        bool success = token.transfer(g.winner, prize);
        if (!success) {
            revert TransferFailed();
        }
        
        emit PrizeClaimed(gameId, g.winner, prize);
    }

    // View functions
    function getUserBalance(address user) external view returns (uint256) {
        return token.balanceOf(user);
    }
    
    function getUserAllowance(address user) external view returns (uint256) {
        return token.allowance(user, address(this));
    }
    
    function canCreateGame(address user) external view returns (bool) {
        uint256 balance = token.balanceOf(user);
        uint256 allowance = token.allowance(user, address(this));
        return balance >= entryFee && allowance >= entryFee;
    }
}
