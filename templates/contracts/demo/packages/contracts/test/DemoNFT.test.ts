import { expect } from "chai";
import { ethers } from "hardhat";

describe("DemoNFT", function () {
  async function deployDemoNFT() {
    const [owner, user] = await ethers.getSigners();

    const DemoNFT = await ethers.getContractFactory("DemoNFT");

    const demoNFT = await DemoNFT.deploy();

    await demoNFT.waitForDeployment();

    return {
      demoNFT,
      owner,
      user,
    };
  }

  describe("Deployment", function () {
    it("should set the correct name", async function () {
      const { demoNFT } = await deployDemoNFT();

      expect(await demoNFT.name()).to.equal("MST Demo NFT");
    });

    it("should set the correct symbol", async function () {
      const { demoNFT } = await deployDemoNFT();

      expect(await demoNFT.symbol()).to.equal("MDNFT");
    });

    it("should assign the owner correctly", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      expect(await demoNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should mint an NFT", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      const tokenURI = "ipfs://QmExampleMetadataCID";

      await demoNFT.mint(owner.address, tokenURI);

      expect(await demoNFT.ownerOf(1)).to.equal(owner.address);
    });

    it("should increase total supply after minting", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      expect(await demoNFT.totalSupply()).to.equal(0);

      await demoNFT.mint(
        owner.address,
        "ipfs://QmExampleMetadataCID"
      );

      expect(await demoNFT.totalSupply()).to.equal(1);
    });

    it("should mint multiple NFTs with different token IDs", async function () {
      const { demoNFT, owner, user } = await deployDemoNFT();

      await demoNFT.mint(
        owner.address,
        "ipfs://QmExampleMetadataCID1"
      );

      await demoNFT.mint(
        user.address,
        "ipfs://QmExampleMetadataCID2"
      );

      expect(await demoNFT.ownerOf(1)).to.equal(owner.address);
      expect(await demoNFT.ownerOf(2)).to.equal(user.address);

      expect(await demoNFT.totalSupply()).to.equal(2);
    });
  });

  describe("Transfers", function () {
    it("should transfer an NFT between users", async function () {
      const { demoNFT, owner, user } = await deployDemoNFT();

      await demoNFT.mint(
        owner.address,
        "ipfs://QmExampleMetadataCID"
      );

      await demoNFT.transferFrom(
        owner.address,
        user.address,
        1
      );

      expect(await demoNFT.ownerOf(1)).to.equal(user.address);
    });
  });

  describe("Token URI", function () {
    it("should return the correct token URI", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      const tokenURI = "ipfs://QmExampleMetadataCID";

      await demoNFT.mint(
        owner.address,
        tokenURI
      );

      expect(await demoNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("should store different metadata URIs for different NFTs", async function () {
      const { demoNFT, owner, user } = await deployDemoNFT();

      const tokenURI1 = "ipfs://QmExampleMetadataCID1";
      const tokenURI2 = "ipfs://QmExampleMetadataCID2";

      await demoNFT.mint(
        owner.address,
        tokenURI1
      );

      await demoNFT.mint(
        user.address,
        tokenURI2
      );

      expect(await demoNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await demoNFT.tokenURI(2)).to.equal(tokenURI2);
    });
  });

  describe("Pause", function () {
    it("should pause minting", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      await demoNFT.pause();

      await expect(
        demoNFT.mint(
          owner.address,
          "ipfs://QmExampleMetadataCID"
        )
      ).to.be.reverted;
    });

    it("should allow minting after unpausing", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      await demoNFT.pause();
      await demoNFT.unpause();

      await demoNFT.mint(
        owner.address,
        "ipfs://QmExampleMetadataCID"
      );

      expect(await demoNFT.ownerOf(1)).to.equal(owner.address);
    });
  });
});