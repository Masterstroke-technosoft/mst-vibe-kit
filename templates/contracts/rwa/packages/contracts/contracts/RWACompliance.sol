// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title RWACompliance
/// @notice Manages KYC verification, whitelist, and blacklist
contract RWACompliance is AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant KYC_APPROVER_ROLE = keccak256("KYC_APPROVER_ROLE");

    struct KYCInfo {
        bool verified;
        uint256 verificationDate;
        string kycLevel;
        uint256 maxTransactionAmount;
    }

    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
    mapping(address => KYCInfo) public kycData;

    event WhitelistUpdated(address indexed account, bool allowed);
    event BlacklistUpdated(address indexed account, bool blacklisted);
    event KYCVerified(address indexed account, string kycLevel, uint256 maxAmount);
    event KYCRevoked(address indexed account);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        _grantRole(KYC_APPROVER_ROLE, msg.sender);

        isWhitelisted[msg.sender] = true;
        emit WhitelistUpdated(msg.sender, true);
    }

    /// @notice Add address to whitelist
    function addToWhitelist(address account) external onlyRole(COMPLIANCE_ROLE) {
        require(!isBlacklisted[account], "RWACompliance: address is blacklisted");
        isWhitelisted[account] = true;
        emit WhitelistUpdated(account, true);
    }

    /// @notice Remove address from whitelist
    function removeFromWhitelist(address account) external onlyRole(COMPLIANCE_ROLE) {
        isWhitelisted[account] = false;
        emit WhitelistUpdated(account, false);
    }

    /// @notice Add address to blacklist
    function addToBlacklist(address account) external onlyRole(COMPLIANCE_ROLE) {
        isBlacklisted[account] = true;
        isWhitelisted[account] = false;
        emit BlacklistUpdated(account, true);
        emit WhitelistUpdated(account, false);
    }

    /// @notice Remove address from blacklist
    function removeFromBlacklist(address account) external onlyRole(COMPLIANCE_ROLE) {
        isBlacklisted[account] = false;
        emit BlacklistUpdated(account, false);
    }

    /// @notice Verify KYC for an address
    function verifyKYC(
        address account,
        string calldata kycLevel,
        uint256 maxTransactionAmount
    ) external onlyRole(KYC_APPROVER_ROLE) {
        require(!isBlacklisted[account], "RWACompliance: address is blacklisted");

        kycData[account] = KYCInfo({
            verified: true,
            verificationDate: block.timestamp,
            kycLevel: kycLevel,
            maxTransactionAmount: maxTransactionAmount
        });

        isWhitelisted[account] = true;
        emit WhitelistUpdated(account, true);
        emit KYCVerified(account, kycLevel, maxTransactionAmount);
    }

    /// @notice Revoke KYC for an address
    function revokeKYC(address account) external onlyRole(KYC_APPROVER_ROLE) {
        kycData[account].verified = false;
        isWhitelisted[account] = false;
        emit KYCRevoked(account);
        emit WhitelistUpdated(account, false);
    }

    /// @notice Check if address can perform transaction
    function canTransact(address from, address to, uint256 amount) external view returns (bool) {
        if (isBlacklisted[from] || isBlacklisted[to]) return false;
        if (!isWhitelisted[from] || !isWhitelisted[to]) return false;

        KYCInfo memory info = kycData[from];
        if (info.verified && info.maxTransactionAmount > 0) {
            return amount <= info.maxTransactionAmount;
        }

        return true;
    }

    /// @notice Get KYC status
    function getKYCStatus(address account) external view returns (bool, string memory, uint256) {
        KYCInfo memory info = kycData[account];
        return (info.verified, info.kycLevel, info.verificationDate);
    }
}
