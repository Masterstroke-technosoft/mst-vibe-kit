// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DemoNFT
/// @notice Simple NFT contract for the demo create-mst-app template.
/// @dev NFT metadata is stored off-chain. The token URI points to the metadata.
contract DemoNFT is ERC721, Ownable, Pausable, ReentrancyGuard {
    uint256 private _nextTokenId = 1;

    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("MST Demo NFT", "MDNFT") Ownable(msg.sender) {}

    function mint(
        address to,
        string calldata tokenURI_
    ) external nonReentrant whenNotPaused returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI_;

        return tokenId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}