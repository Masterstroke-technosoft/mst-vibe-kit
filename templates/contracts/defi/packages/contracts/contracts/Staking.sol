// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Staking
/// @notice Stake `stakingToken` to earn `stakingToken` rewards at a fixed rate
/// per second, split pro-rata across all stakers (Synthetix-style accumulator).
/// The `defi` create-mst-app template.
contract Staking is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable stakingToken;

    uint256 public rewardRatePerSecond;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) private userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 previousRate, uint256 newRate);

    constructor(address _stakingToken, uint256 _rewardRatePerSecond) {
        stakingToken = IERC20(_stakingToken);
        rewardRatePerSecond = _rewardRatePerSecond;
        lastUpdateTime = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        uint256 elapsed = block.timestamp - lastUpdateTime;
        return rewardPerTokenStored + (elapsed * rewardRatePerSecond * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        return
            rewards[account] +
            (balanceOf[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Staking: amount is zero");
        totalStaked += amount;
        balanceOf[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0 && amount <= balanceOf[msg.sender], "Staking: invalid amount");
        totalStaked -= amount;
        balanceOf[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "Staking: nothing to claim");
        rewards[msg.sender] = 0;
        stakingToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function setRewardRate(uint256 newRate) external onlyRole(ADMIN_ROLE) updateReward(address(0)) {
        emit RewardRateUpdated(rewardRatePerSecond, newRate);
        rewardRatePerSecond = newRate;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
