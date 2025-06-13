// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Web3DuelGameV3 is Ownable {
    IERC20 public token;
    uint256 public entryFee;

    enum GameStatus { Active, Completed, Tied }

    struct Game {
        address player1;
        address player2;
        address winner;
        bool claimed;
        bool refunded;
        string gameType;
        GameStatus status;
        uint256 createdAt;
    }

    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;

    event GameCreated(uint256 indexed gameId, address indexed player1, string gameType);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event WinnerDeclared(uint256 indexed gameId, address indexed winner);
    event GameTied(uint256 indexed gameId);
    event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount);
    event RefundClaimed(uint256 indexed gameId, address indexed player, uint256 amount);

    // Custom errors for better debugging
    error InsufficientBalance(uint256 required, uint256 available);
    error InsufficientAllowance(uint256 required, uint256 available);
    error GameFull();
    error CannotJoinOwnGame();
    error GameNotActive();
    error WinnerAlreadyDeclared();
    error InvalidWinner();
    error NotWinner();
    error PrizeAlreadyClaimed();
    error RefundAlreadyClaimed();
    error TransferFailed();
    error GameNotCompleted();
    error NotParticipant();

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
        
        games[gameIdCounter] = Game({
            player1: msg.sender,
            player2: address(0),
            winner: address(0),
            claimed: false,
            refunded: false,
            gameType: gameType,
            status: GameStatus.Active,
            createdAt: block.timestamp
        });
        
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
        
        if (g.status != GameStatus.Active) {
            revert GameNotActive();
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
        
        if (g.status != GameStatus.Active) {
            revert GameNotActive();
        }
        
        if (g.player2 == address(0)) {
            revert GameNotCompleted();
        }
        
        if (winner != g.player1 && winner != g.player2) {
            revert InvalidWinner();
        }
        
        g.winner = winner;
        g.status = GameStatus.Completed;
        emit WinnerDeclared(gameId, winner);
    }

    function declareTie(uint256 gameId) external onlyOwner {
        Game storage g = games[gameId];
        
        if (g.status != GameStatus.Active) {
            revert GameNotActive();
        }
        
        if (g.player2 == address(0)) {
            revert GameNotCompleted();
        }
        
        g.status = GameStatus.Tied;
        emit GameTied(gameId);
    }

    function claimPrize(uint256 gameId) external {
        Game storage g = games[gameId];
        
        if (g.status != GameStatus.Completed) {
            revert GameNotCompleted();
        }
        
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

    function claimRefund(uint256 gameId) external {
        Game storage g = games[gameId];
        
        if (g.status != GameStatus.Tied) {
            revert GameNotCompleted();
        }
        
        if (msg.sender != g.player1 && msg.sender != g.player2) {
            revert NotParticipant();
        }
        
        if (g.refunded) {
            revert RefundAlreadyClaimed();
        }
        
        // Check if this is the first refund claim
        bool isFirstClaim = !g.claimed;
        
        if (isFirstClaim) {
            g.claimed = true; // Mark as started
        } else {
            g.refunded = true; // Mark as fully refunded
        }
        
        bool success = token.transfer(msg.sender, entryFee);
        if (!success) {
            revert TransferFailed();
        }
        
        emit RefundClaimed(gameId, msg.sender, entryFee);
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

    function getGameInfo(uint256 gameId) external view returns (
        address player1,
        address player2,
        address winner,
        bool claimed,
        bool refunded,
        string memory gameType,
        GameStatus status,
        uint256 createdAt
    ) {
        Game storage g = games[gameId];
        return (
            g.player1,
            g.player2,
            g.winner,
            g.claimed,
            g.refunded,
            g.gameType,
            g.status,
            g.createdAt
        );
    }

    function getActiveGames() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count active games
        for (uint256 i = 0; i < gameIdCounter; i++) {
            if (games[i].status == GameStatus.Active && games[i].player2 == address(0)) {
                count++;
            }
        }
        
        // Create array of active game IDs
        uint256[] memory activeGames = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < gameIdCounter; i++) {
            if (games[i].status == GameStatus.Active && games[i].player2 == address(0)) {
                activeGames[index] = i;
                index++;
            }
        }
        
        return activeGames;
    }
} 