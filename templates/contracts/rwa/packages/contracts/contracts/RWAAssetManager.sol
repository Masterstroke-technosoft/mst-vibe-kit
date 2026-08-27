// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title RWAAssetManager
/// @notice Manages real-world asset information, valuation, and custodian details
contract RWAAssetManager is AccessControl {
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct Asset {
        string assetId;
        string assetType;
        uint256 valuation;
        address custodian;
        bytes32 documentationHash;
        uint256 createdAt;
        bool active;
    }

    Asset public assetDetails;
    uint256 public pricePerShare;

    event AssetUpdated(
        string indexed assetId,
        string assetType,
        uint256 valuation,
        address custodian
    );
    event PriceUpdated(uint256 previousPrice, uint256 newPrice);
    event DocumentationUpdated(string indexed assetId, bytes32 documentationHash);

    constructor(
        string memory assetId_,
        string memory assetType_,
        uint256 initialValuation_,
        address custodian_,
        uint256 initialPricePerShare_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ASSET_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);

        assetDetails = Asset({
            assetId: assetId_,
            assetType: assetType_,
            valuation: initialValuation_,
            custodian: custodian_,
            documentationHash: bytes32(0),
            createdAt: block.timestamp,
            active: false
        });

        pricePerShare = initialPricePerShare_;
    }

    /// @notice Update asset valuation
    function setValuation(uint256 newValuation) external onlyRole(ASSET_MANAGER_ROLE) {
        assetDetails.valuation = newValuation;
        emit AssetUpdated(
            assetDetails.assetId,
            assetDetails.assetType,
            newValuation,
            assetDetails.custodian
        );
    }

    /// @notice Update price per share (called by oracle)
    function setPricePerShare(uint256 newPrice) external onlyRole(ORACLE_ROLE) {
        uint256 oldPrice = pricePerShare;
        pricePerShare = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    /// @notice Update custodian address
    function setCustodian(address newCustodian) external onlyRole(ASSET_MANAGER_ROLE) {
        assetDetails.custodian = newCustodian;
        emit AssetUpdated(
            assetDetails.assetId,
            assetDetails.assetType,
            assetDetails.valuation,
            newCustodian
        );
    }

    /// @notice Update documentation hash
    function setDocumentationHash(bytes32 hash) external onlyRole(ASSET_MANAGER_ROLE) {
        assetDetails.documentationHash = hash;
        emit DocumentationUpdated(assetDetails.assetId, hash);
    }

    /// @notice Get formatted price per share in USD cents
    function getPricePerShareUSD() external view returns (string memory) {
        return string(abi.encodePacked("$", _uintToString(pricePerShare / 100), ".", _padZeros(pricePerShare % 100)));
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _padZeros(uint256 value) internal pure returns (string memory) {
        if (value < 10) return string(abi.encodePacked("0", _uintToString(value)));
        return _uintToString(value);
    }
}
