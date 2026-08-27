// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title RWADistribution
/// @notice Manages income distribution to token holders
contract RWADistribution is AccessControl, ReentrancyGuard {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    struct Distribution {
        uint256 amount;
        uint256 timestamp;
        string description;
        uint256 totalShares;
        bool processed;
    }

    struct Claim {
        address holder;
        uint256 distributionId;
        uint256 amount;
        bool claimed;
        uint256 claimTime;
    }

    IERC20 public incomeToken;
    uint256 private nextDistributionId = 1;
    uint256 private nextClaimId = 1;

    mapping(uint256 => Distribution) public distributions;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public holderClaims;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    uint256 public totalDistributed;
    uint256 public totalClaimed;

    event DistributionCreated(uint256 indexed distributionId, uint256 amount, string description);
    event IncomeDistributed(
        uint256 indexed distributionId,
        uint256 amount,
        uint256 totalShares,
        uint256 timestamp
    );
    event DistributionClaimed(
        uint256 indexed claimId,
        address indexed holder,
        uint256 distributionId,
        uint256 amount
    );

    constructor(address incomeToken_) {
        require(incomeToken_ != address(0), "RWADistribution: invalid income token");
        incomeToken = IERC20(incomeToken_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
    }

    /// @notice Create a new income distribution
    function createDistribution(
        uint256 amount,
        string calldata description,
        uint256 totalShares
    ) external onlyRole(DISTRIBUTOR_ROLE) returns (uint256 distributionId) {
        require(amount > 0, "RWADistribution: amount must be > 0");
        require(totalShares > 0, "RWADistribution: totalShares must be > 0");

        distributionId = nextDistributionId++;
        distributions[distributionId] = Distribution({
            amount: amount,
            timestamp: block.timestamp,
            description: description,
            totalShares: totalShares,
            processed: false
        });

        totalDistributed += amount;
        emit DistributionCreated(distributionId, amount, description);
    }

    /// @notice Process distribution (must have approved funds)
    function processDistribution(uint256 distributionId) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        Distribution storage dist = distributions[distributionId];
        require(!dist.processed, "RWADistribution: distribution already processed");

        require(
            incomeToken.transferFrom(msg.sender, address(this), dist.amount),
            "RWADistribution: transfer failed"
        );

        dist.processed = true;
        emit IncomeDistributed(
            distributionId,
            dist.amount,
            dist.totalShares,
            block.timestamp
        );
    }

    /// @notice Create and immediately claim a distribution for a holder
    function createAndClaimDistribution(
        address holder,
        uint256 amount,
        string calldata description
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(holder != address(0), "RWADistribution: invalid holder");
        require(amount > 0, "RWADistribution: amount must be > 0");

        uint256 distributionId = nextDistributionId++;
        distributions[distributionId] = Distribution({
            amount: amount,
            timestamp: block.timestamp,
            description: description,
            totalShares: 1,
            processed: true
        });

        uint256 claimId = nextClaimId++;
        claims[claimId] = Claim({
            holder: holder,
            distributionId: distributionId,
            amount: amount,
            claimed: true,
            claimTime: block.timestamp
        });

        holderClaims[holder].push(claimId);
        hasClaimed[distributionId][holder] = true;
        totalClaimed += amount;

        emit DistributionCreated(distributionId, amount, description);
        emit IncomeDistributed(distributionId, amount, 1, block.timestamp);
        emit DistributionClaimed(claimId, holder, distributionId, amount);
    }

    /// @notice Claim distribution for address
    function claimDistribution(
        address holder,
        uint256 distributionId,
        uint256 shareAmount,
        uint256 totalShares
    ) external nonReentrant returns (uint256 claimId) {
        require(msg.sender == holder || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "RWADistribution: unauthorized");

        Distribution storage dist = distributions[distributionId];
        require(dist.processed, "RWADistribution: distribution not processed");
        require(!hasClaimed[distributionId][holder], "RWADistribution: already claimed");

        uint256 claimAmount = (dist.amount * shareAmount) / totalShares;
        require(claimAmount > 0, "RWADistribution: claim amount is 0");

        claimId = nextClaimId++;
        claims[claimId] = Claim({
            holder: holder,
            distributionId: distributionId,
            amount: claimAmount,
            claimed: true,
            claimTime: block.timestamp
        });

        holderClaims[holder].push(claimId);
        hasClaimed[distributionId][holder] = true;
        totalClaimed += claimAmount;

        require(incomeToken.transfer(holder, claimAmount), "RWADistribution: transfer failed");

        emit DistributionClaimed(claimId, holder, distributionId, claimAmount);
    }

    /// @notice Get distribution details
    function getDistribution(uint256 distributionId) external view returns (Distribution memory) {
        return distributions[distributionId];
    }

    /// @notice Get claim details
    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }

    /// @notice Get holder's claims
    function getHolderClaims(address holder) external view returns (uint256[] memory) {
        return holderClaims[holder];
    }

    /// @notice Get available distribution info for holder
    function getAvailableDistributions(uint256[] calldata distributionIds, address holder)
        external view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](distributionIds.length);
        for (uint256 i = 0; i < distributionIds.length; i++) {
            if (!hasClaimed[distributionIds[i]][holder]) {
                amounts[i] = distributions[distributionIds[i]].amount;
            }
        }
    }
}
