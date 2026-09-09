import { expect } from "chai";
import { ethers } from "hardhat";

describe("ParametricInsurance", function () {
  async function deployInsurance() {
    const [owner, holder, oracle, other] = await ethers.getSigners();

    const ParametricInsurance = await ethers.getContractFactory("ParametricInsurance");
    const insurance = await ParametricInsurance.deploy(oracle.address);
    await insurance.waitForDeployment();

    const coverageAmount = ethers.parseEther("10");
    const premium = await insurance.calculatePremium(coverageAmount);
    const triggerThreshold = 120n; // e.g. minutes of flight delay
    const durationSeconds = 3600 * 24 * 7; // 7 days

    return { insurance, owner, holder, oracle, other, coverageAmount, premium, triggerThreshold, durationSeconds };
  }

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      const { insurance, owner } = await deployInsurance();
      expect(await insurance.owner()).to.equal(owner.address);
    });

    it("should set the initial oracle", async function () {
      const { insurance, oracle } = await deployInsurance();
      expect(await insurance.oracle()).to.equal(oracle.address);
    });

    it("should default the premium rate to 5%", async function () {
      const { insurance } = await deployInsurance();
      expect(await insurance.premiumRateBps()).to.equal(500n);
    });
  });

  describe("Purchasing policies", function () {
    it("should compute premium as a percentage of coverage", async function () {
      const { insurance, coverageAmount } = await deployInsurance();
      const premium = await insurance.calculatePremium(coverageAmount);
      expect(premium).to.equal((coverageAmount * 500n) / 10_000n);
    });

    it("should issue a policy when the exact premium is sent", async function () {
      const { insurance, holder, coverageAmount, premium, triggerThreshold, durationSeconds } =
        await deployInsurance();

      await insurance
        .connect(holder)
        .purchasePolicy(coverageAmount, triggerThreshold, durationSeconds, "flight_delay_minutes", {
          value: premium,
        });

      const policy = await insurance.getPolicy(1);
      expect(policy.holder).to.equal(holder.address);
      expect(policy.coverageAmount).to.equal(coverageAmount);
      expect(policy.status).to.equal(0); // Active
      expect(await insurance.totalPolicies()).to.equal(1n);
    });

    it("should reject purchases with an incorrect premium", async function () {
      const { insurance, holder, coverageAmount, triggerThreshold, durationSeconds } =
        await deployInsurance();

      await expect(
        insurance
          .connect(holder)
          .purchasePolicy(coverageAmount, triggerThreshold, durationSeconds, "flight_delay_minutes", {
            value: 1,
          })
      ).to.be.revertedWith("ParametricInsurance: incorrect premium sent");
    });

    it("should add the premium to the pool balance", async function () {
      const { insurance, holder, coverageAmount, premium, triggerThreshold, durationSeconds } =
        await deployInsurance();

      await insurance
        .connect(holder)
        .purchasePolicy(coverageAmount, triggerThreshold, durationSeconds, "flight_delay_minutes", {
          value: premium,
        });

      expect(await insurance.poolBalance()).to.equal(premium);
    });
  });

  describe("Oracle-triggered claims", function () {
    async function purchaseActivePolicy() {
      const ctx = await deployInsurance();
      await ctx.insurance
        .connect(ctx.owner)
        .fundPool({ value: ctx.coverageAmount }); // ensure pool can cover the payout

      await ctx.insurance
        .connect(ctx.holder)
        .purchasePolicy(
          ctx.coverageAmount,
          ctx.triggerThreshold,
          ctx.durationSeconds,
          "flight_delay_minutes",
          { value: ctx.premium }
        );

      return ctx;
    }

    it("should pay out automatically when the observed value meets the threshold", async function () {
      const { insurance, holder, oracle, coverageAmount, triggerThreshold } =
        await purchaseActivePolicy();

      const balanceBefore = await ethers.provider.getBalance(holder.address);

      await insurance.connect(oracle).submitOracleData(1, triggerThreshold);

      const balanceAfter = await ethers.provider.getBalance(holder.address);
      expect(balanceAfter - balanceBefore).to.equal(coverageAmount);

      const policy = await insurance.getPolicy(1);
      expect(policy.status).to.equal(1); // PaidOut
    });

    it("should not pay out when the observed value is below the threshold", async function () {
      const { insurance, holder, oracle, triggerThreshold } = await purchaseActivePolicy();

      const balanceBefore = await ethers.provider.getBalance(holder.address);

      await insurance.connect(oracle).submitOracleData(1, triggerThreshold - 1n);

      const balanceAfter = await ethers.provider.getBalance(holder.address);
      expect(balanceAfter).to.equal(balanceBefore);

      const policy = await insurance.getPolicy(1);
      expect(policy.status).to.equal(0); // still Active
    });

    it("should reject oracle submissions from a non-oracle address", async function () {
      const { insurance, other, triggerThreshold } = await purchaseActivePolicy();

      await expect(
        insurance.connect(other).submitOracleData(1, triggerThreshold)
      ).to.be.revertedWith("ParametricInsurance: caller is not the oracle");
    });

    it("should reject a payout the pool cannot cover", async function () {
      const ctx = await deployInsurance();

      await ctx.insurance
        .connect(ctx.holder)
        .purchasePolicy(
          ctx.coverageAmount,
          ctx.triggerThreshold,
          ctx.durationSeconds,
          "flight_delay_minutes",
          { value: ctx.premium }
        );

      await expect(
        ctx.insurance.connect(ctx.oracle).submitOracleData(1, ctx.triggerThreshold)
      ).to.be.revertedWith("ParametricInsurance: pool underfunded");
    });
  });

  describe("Expiry", function () {
    it("should allow expiring a policy after its window passes", async function () {
      const { insurance, holder, premium, coverageAmount, triggerThreshold } = await deployInsurance();

      await insurance
        .connect(holder)
        .purchasePolicy(coverageAmount, triggerThreshold, 60, "flight_delay_minutes", {
          value: premium,
        });

      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine", []);

      await insurance.expirePolicy(1);

      const policy = await insurance.getPolicy(1);
      expect(policy.status).to.equal(2); // Expired
    });

    it("should reject expiring a policy before its window passes", async function () {
      const { insurance, holder, premium, coverageAmount, triggerThreshold, durationSeconds } =
        await deployInsurance();

      await insurance
        .connect(holder)
        .purchasePolicy(coverageAmount, triggerThreshold, durationSeconds, "flight_delay_minutes", {
          value: premium,
        });

      await expect(insurance.expirePolicy(1)).to.be.revertedWith(
        "ParametricInsurance: policy not yet expired"
      );
    });
  });

  describe("Admin", function () {
    it("should let the owner update the oracle", async function () {
      const { insurance, other } = await deployInsurance();

      await insurance.setOracle(other.address);
      expect(await insurance.oracle()).to.equal(other.address);
    });

    it("should let the owner update the premium rate", async function () {
      const { insurance } = await deployInsurance();

      await insurance.setPremiumRateBps(1000);
      expect(await insurance.premiumRateBps()).to.equal(1000n);
    });

    it("should let the owner withdraw from the pool", async function () {
      const { insurance, owner } = await deployInsurance();

      await insurance.fundPool({ value: ethers.parseEther("1") });
      await expect(insurance.withdrawPool(ethers.parseEther("1"))).to.changeEtherBalance(
        owner,
        ethers.parseEther("1")
      );
    });

    it("should reject non-owner admin calls", async function () {
      const { insurance, other } = await deployInsurance();

      await expect(insurance.connect(other).setOracle(other.address)).to.be.reverted;
      await expect(insurance.connect(other).setPremiumRateBps(100)).to.be.reverted;
    });
  });
});
