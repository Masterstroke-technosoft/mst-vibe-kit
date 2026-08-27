// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RWAAssetLifecycle
/// @notice Manages asset lifecycle: activate, pause, and redemption
contract RWAAssetLifecycle is AccessControl, ReentrancyGuard {
    bytes32 public constant LIFECYCLE_MANAGER_ROLE = keccak256("LIFECYCLE_MANAGER_ROLE");

    enum AssetStatus {
        PENDING,
        ACTIVE,
        PAUSED,
        REDEEMED,
        TERMINATED
    }

    struct RedemptionRequest {
        address holder;
        uint256 shares;
        uint256 requestTime;
        uint256 processedTime;
        bool processed;
        string status;
    }

    AssetStatus public currentStatus;
    uint256 public activationTime;
    uint256 public pauseTime;
    uint256 private nextRedemptionId = 1;

    mapping(uint256 => RedemptionRequest) public redemptionRequests;
    mapping(address => uint256[]) public userRedemptions;

    event AssetActivated(uint256 timestamp);
    event AssetPaused(uint256 timestamp);
    event AssetResumed(uint256 timestamp);
    event RedemptionRequested(uint256 indexed requestId, address indexed holder, uint256 shares);
    event RedemptionProcessed(uint256 indexed requestId, uint256 processedTime);
    event AssetTerminated(uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LIFECYCLE_MANAGER_ROLE, msg.sender);
        currentStatus = AssetStatus.PENDING;
    }

    /// @notice Activate the asset
    function activateAsset() external onlyRole(LIFECYCLE_MANAGER_ROLE) {
        require(currentStatus == AssetStatus.PENDING, "RWAAssetLifecycle: asset already activated");
        currentStatus = AssetStatus.ACTIVE;
        activationTime = block.timestamp;
        emit AssetActivated(block.timestamp);
    }

    /// @notice Pause the asset
    function pauseAsset() external onlyRole(LIFECYCLE_MANAGER_ROLE) {
        require(currentStatus == AssetStatus.ACTIVE, "RWAAssetLifecycle: asset is not active");
        currentStatus = AssetStatus.PAUSED;
        pauseTime = block.timestamp;
        emit AssetPaused(block.timestamp);
    }

    /// @notice Resume the asset
    function resumeAsset() external onlyRole(LIFECYCLE_MANAGER_ROLE) {
        require(currentStatus == AssetStatus.PAUSED, "RWAAssetLifecycle: asset is not paused");
        currentStatus = AssetStatus.ACTIVE;
        emit AssetResumed(block.timestamp);
    }

    /// @notice Request redemption
    function requestRedemption(address holder, uint256 shares) external onlyRole(LIFECYCLE_MANAGER_ROLE) returns (uint256 requestId) {
        require(currentStatus == AssetStatus.ACTIVE, "RWAAssetLifecycle: asset is not active");

        requestId = nextRedemptionId++;
        redemptionRequests[requestId] = RedemptionRequest({
            holder: holder,
            shares: shares,
            requestTime: block.timestamp,
            processedTime: 0,
            processed: false,
            status: "PENDING"
        });

        userRedemptions[holder].push(requestId);
        emit RedemptionRequested(requestId, holder, shares);
    }

    /// @notice Process redemption
    function processRedemption(uint256 requestId) external onlyRole(LIFECYCLE_MANAGER_ROLE) {
        RedemptionRequest storage req = redemptionRequests[requestId];
        require(!req.processed, "RWAAssetLifecycle: redemption already processed");

        req.processed = true;
        req.processedTime = block.timestamp;
        req.status = "PROCESSED";
        emit RedemptionProcessed(requestId, block.timestamp);
    }

    /// @notice Terminate the asset
    function terminateAsset() external onlyRole(LIFECYCLE_MANAGER_ROLE) {
        require(currentStatus != AssetStatus.TERMINATED, "RWAAssetLifecycle: asset already terminated");
        currentStatus = AssetStatus.TERMINATED;
        emit AssetTerminated(block.timestamp);
    }

    /// @notice Get asset status as string
    function getAssetStatus() external view returns (string memory) {
        if (currentStatus == AssetStatus.PENDING) return "PENDING";
        if (currentStatus == AssetStatus.ACTIVE) return "ACTIVE";
        if (currentStatus == AssetStatus.PAUSED) return "PAUSED";
        if (currentStatus == AssetStatus.REDEEMED) return "REDEEMED";
        return "TERMINATED";
    }

    /// @notice Get redemption request details
    function getRedemptionRequest(uint256 requestId) external view returns (RedemptionRequest memory) {
        return redemptionRequests[requestId];
    }

    /// @notice Get user's redemption requests
    function getUserRedemptions(address user) external view returns (uint256[] memory) {
        return userRedemptions[user];
    }
}
