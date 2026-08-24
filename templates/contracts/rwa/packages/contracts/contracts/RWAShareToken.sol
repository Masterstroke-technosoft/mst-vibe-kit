// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RWAShareToken
/// @notice Permissioned ERC-20 representing fractional ownership of an off-chain
/// real-world asset. Only whitelisted (KYC'd) addresses may hold or transfer it.
/// The `rwa` create-mst-app template.
contract RWAShareToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    /// @notice Off-chain NAV, expressed in USD cents per whole share (1e18 units).
    /// Updated by ORACLE_ROLE as the underlying asset is re-appraised.
    uint256 public pricePerShare;

    mapping(address => bool) public isWhitelisted;

    uint256 private nextRedemptionId = 1;

    event WhitelistUpdated(address indexed account, bool allowed);
    event PriceUpdated(uint256 previousPrice, uint256 newPrice);
    event RedemptionRequested(address indexed holder, uint256 shares, uint256 requestId);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialPricePerShare
    ) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);

        isWhitelisted[msg.sender] = true;
        emit WhitelistUpdated(msg.sender, true);

        pricePerShare = initialPricePerShare;
    }

    function setWhitelisted(address account, bool allowed) external onlyRole(COMPLIANCE_ROLE) {
        isWhitelisted[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    function setPricePerShare(uint256 newPrice) external onlyRole(ORACLE_ROLE) {
        emit PriceUpdated(pricePerShare, newPrice);
        pricePerShare = newPrice;
    }

    /// @notice Issue new shares to a whitelisted holder, e.g. after an off-chain
    /// subscription has settled.
    function issue(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Burn the caller's shares and emit a redemption event for the
    /// off-chain custodian to action a payout against.
    function requestRedemption(
        uint256 shares
    ) external nonReentrant whenNotPaused returns (uint256 requestId) {
        _burn(msg.sender, shares);
        requestId = nextRedemptionId++;
        emit RedemptionRequested(msg.sender, shares, requestId);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        // Minting (from == 0) and burning (to == 0) skip the whitelist check on
        // the zero address itself; the live counterparty must still be whitelisted.
        if (from != address(0)) {
            require(isWhitelisted[from], "RWAShareToken: sender not whitelisted");
        }
        if (to != address(0)) {
            require(isWhitelisted[to], "RWAShareToken: recipient not whitelisted");
        }
        super._update(from, to, value);
    }
}
