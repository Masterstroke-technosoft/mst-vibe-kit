import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { RWAToken, RWAAssetManager, RWACompliance, RWAAssetLifecycle, RWADistribution } from "../typechain-types";

describe("RWA Contracts Suite", () => {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let token: RWAToken;
  let assetManager: RWAAssetManager;
  let compliance: RWACompliance;
  let lifecycle: RWAAssetLifecycle;
  let distribution: RWADistribution;

  const tokenName = "Main Street Property Shares";
  const tokenSymbol = "MSPS";
  const assetId = "MSPS-001";
  const assetType = "Commercial Real Estate";
  const initialValuation = ethers.parseEther("1000000");
  const initialPrice = 10_000; // $100.00

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe("Deployment", () => {
    it("Should deploy RWAToken", async () => {
      const RWAToken = await ethers.getContractFactory("RWAToken");
      token = await RWAToken.deploy(tokenName, tokenSymbol);
      await token.waitForDeployment();
      expect(await token.name()).to.equal(tokenName);
      expect(await token.symbol()).to.equal(tokenSymbol);
    });

    it("Should deploy RWAAssetManager", async () => {
      const RWAAssetManager = await ethers.getContractFactory("RWAAssetManager");
      assetManager = await RWAAssetManager.deploy(
        assetId,
        assetType,
        initialValuation,
        owner.address,
        initialPrice
      );
      await assetManager.waitForDeployment();
    });

    it("Should deploy RWACompliance", async () => {
      const RWACompliance = await ethers.getContractFactory("RWACompliance");
      compliance = await RWACompliance.deploy();
      await compliance.waitForDeployment();
    });

    it("Should deploy RWAAssetLifecycle", async () => {
      const RWAAssetLifecycle = await ethers.getContractFactory("RWAAssetLifecycle");
      lifecycle = await RWAAssetLifecycle.deploy();
      await lifecycle.waitForDeployment();
    });

    it("Should deploy RWADistribution with token address", async () => {
      const RWADistribution = await ethers.getContractFactory("RWADistribution");
      distribution = await RWADistribution.deploy(await token.getAddress());
      await distribution.waitForDeployment();
    });
  });

  describe("RWAToken", () => {
    it("Should mint tokens", async () => {
      const amount = ethers.parseEther("100");
      await token.mint(addr1.address, amount);
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(amount);
    });

    it("Should burn tokens", async () => {
      const amount = ethers.parseEther("50");
      await token.burn(addr1.address, amount);
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("50"));
    });

    it("Should pause and unpause transfers", async () => {
      await token.pause();
      expect(await token.paused()).to.be.true;

      await expect(
        token.transfer(addr2.address, ethers.parseEther("10"))
      ).to.be.reverted;

      await token.unpause();
      expect(await token.paused()).to.be.false;
    });
  });

  describe("RWACompliance", () => {
    it("Should add address to whitelist", async () => {
      await compliance.addToWhitelist(addr1.address);
      const isWhitelisted = await compliance.isWhitelisted(addr1.address);
      expect(isWhitelisted).to.be.true;
    });

    it("Should remove address from whitelist", async () => {
      await compliance.removeFromWhitelist(addr1.address);
      const isWhitelisted = await compliance.isWhitelisted(addr1.address);
      expect(isWhitelisted).to.be.false;
    });

    it("Should add address to blacklist", async () => {
      await compliance.addToBlacklist(addr2.address);
      const isBlacklisted = await compliance.isBlacklisted(addr2.address);
      expect(isBlacklisted).to.be.true;
    });

    it("Should verify KYC", async () => {
      const maxAmount = ethers.parseEther("10000");
      await compliance.verifyKYC(addr1.address, "LEVEL_1", maxAmount);

      const isWhitelisted = await compliance.isWhitelisted(addr1.address);
      expect(isWhitelisted).to.be.true;

      const [verified, level] = await compliance.getKYCStatus(addr1.address);
      expect(verified).to.be.true;
      expect(level).to.equal("LEVEL_1");
    });
  });

  describe("RWAAssetManager", () => {
    it("Should update valuation", async () => {
      const newValuation = ethers.parseEther("1500000");
      await assetManager.setValuation(newValuation);
      const asset = await assetManager.assetDetails();
      expect(asset.valuation).to.equal(newValuation);
    });

    it("Should update price per share", async () => {
      const newPrice = 15_000;
      await assetManager.setPricePerShare(newPrice);
      expect(await assetManager.pricePerShare()).to.equal(newPrice);
    });

    it("Should update custodian", async () => {
      await assetManager.setCustodian(addr1.address);
      const asset = await assetManager.assetDetails();
      expect(asset.custodian).to.equal(addr1.address);
    });
  });

  describe("RWAAssetLifecycle", () => {
    it("Should activate asset", async () => {
      await lifecycle.activateAsset();
      const status = await lifecycle.getAssetStatus();
      expect(status).to.equal("ACTIVE");
    });

    it("Should pause asset", async () => {
      await lifecycle.pauseAsset();
      const status = await lifecycle.getAssetStatus();
      expect(status).to.equal("PAUSED");
    });

    it("Should resume asset", async () => {
      await lifecycle.resumeAsset();
      const status = await lifecycle.getAssetStatus();
      expect(status).to.equal("ACTIVE");
    });

    it("Should request redemption", async () => {
      const shares = ethers.parseEther("100");
      const tx = await lifecycle.requestRedemption(addr1.address, shares);
      expect(tx).to.emit(lifecycle, "RedemptionRequested");
    });

    it("Should terminate asset", async () => {
      await lifecycle.terminateAsset();
      const status = await lifecycle.getAssetStatus();
      expect(status).to.equal("TERMINATED");
    });
  });

  describe("RWADistribution", () => {
    beforeEach(async () => {
      const RWAAssetLifecycle = await ethers.getContractFactory("RWAAssetLifecycle");
      lifecycle = await RWAAssetLifecycle.deploy();
      await lifecycle.waitForDeployment();
      await lifecycle.activateAsset();
    });

    it("Should create distribution", async () => {
      const amount = ethers.parseEther("1000");
      const tx = await distribution.createDistribution(
        amount,
        "Monthly dividend",
        ethers.parseEther("100")
      );
      expect(tx).to.emit(distribution, "DistributionCreated");
    });

    it("Should track total distributed", async () => {
      const amount = ethers.parseEther("1000");
      const initialTotal = await distribution.totalDistributed();
      await distribution.createDistribution(
        amount,
        "Test distribution",
        ethers.parseEther("100")
      );
      const newTotal = await distribution.totalDistributed();
      expect(newTotal).to.equal(initialTotal + amount);
    });
  });
});
