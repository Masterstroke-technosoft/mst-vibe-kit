import { expect } from "chai";
import { ethers } from "hardhat";

describe("DemoNFT", function () {
  async function deployDemoNFT() {
    const [owner, user] = await ethers.getSigners();

    const name = "Demo NFT";
    const symbol = "DNFT";
    const baseURI = "https://example.com/metadata/";

    const DemoNFT = await ethers.getContractFactory("DemoNFT");

    const demoNFT = await DemoNFT.deploy(
      name,
      symbol,
      baseURI
    );

    await demoNFT.waitForDeployment();

    return {
      demoNFT,
      owner,
      user,
      name,
      symbol,
      baseURI,
    };
  }

  describe("Deployment", function () {
    it("should set the correct name", async function () {
      const { demoNFT, name } = await deployDemoNFT();

      expect(await demoNFT.name()).to.equal(name);
    });

    it("should set the correct symbol", async function () {
      const { demoNFT, symbol } = await deployDemoNFT();

      expect(await demoNFT.symbol()).to.equal(symbol);
    });

    it("should assign the owner correctly", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      expect(await demoNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should mint an NFT", async function () {
      const { demoNFT, owner } = await deployDemoNFT();

      await demoNFT.mint(owner.address);

      expect(await demoNFT.ownerOf(0)).to.equal(owner.address);
    });

    it("should increase total supply after minting", async function () {
      const { demoNFT } = await deployDemoNFT();

      expect(await demoNFT.totalSupply()).to.equal(0);

      await demoNFT.mint(
        (await ethers.getSigners())[0].address
      );

      expect(await demoNFT.totalSupply()).to.equal(1);
    });
  });

  describe("Transfers", function () {
    it("should transfer an NFT between users", async function () {
      const { demoNFT, owner, user } = await deployDemoNFT();

      await demoNFT.mint(owner.address);

      await demoNFT.transferFrom(
        owner.address,
        user.address,
        0
      );

      expect(await demoNFT.ownerOf(0)).to.equal(user.address);
    });
  });

  describe("Token URI", function () {
    it("should return the correct token URI", async function () {
      const { demoNFT, owner, baseURI } = await deployDemoNFT();

      await demoNFT.mint(owner.address);

      expect(await demoNFT.tokenURI(0)).to.equal(
        `${baseURI}0`
      );
    });
  });
});