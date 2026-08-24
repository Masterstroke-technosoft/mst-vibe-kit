import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("Staking", () => {
  async function deployFixture() {
    const [admin, alice, bob] = await ethers.getSigners();

    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    const token = await ProjectToken.deploy(
      "Project Token",
      "PROJ",
      ethers.parseEther("1000000")
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const rewardRatePerSecond = ethers.parseEther("1"); // 1 PROJ/sec, easy to reason about
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(tokenAddress, rewardRatePerSecond);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();

    await token.transfer(stakingAddress, ethers.parseEther("100000"));
    await token.transfer(alice.address, ethers.parseEther("1000"));
    await token.transfer(bob.address, ethers.parseEther("1000"));

    await token.connect(alice).approve(stakingAddress, ethers.MaxUint256);
    await token.connect(bob).approve(stakingAddress, ethers.MaxUint256);

    return { token, staking, admin, alice, bob };
  }

  it("lets a user stake and unstake", async () => {
    const { staking, alice } = await deployFixture();
    await staking.connect(alice).stake(ethers.parseEther("100"));
    expect(await staking.balanceOf(alice.address)).to.equal(ethers.parseEther("100"));
    expect(await staking.totalStaked()).to.equal(ethers.parseEther("100"));

    await staking.connect(alice).unstake(ethers.parseEther("40"));
    expect(await staking.balanceOf(alice.address)).to.equal(ethers.parseEther("60"));
  });

  it("accrues rewards over time", async () => {
    const { token, staking, alice } = await deployFixture();
    await staking.connect(alice).stake(ethers.parseEther("100"));

    await network.provider.send("evm_increaseTime", [100]);
    await network.provider.send("evm_mine");

    const earned = await staking.earned(alice.address);
    // ~100 seconds * 1 PROJ/sec, alice is the only staker so she earns ~all of it
    expect(earned).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("2"));

    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).claimReward();
    const after = await token.balanceOf(alice.address);
    expect(after).to.be.gt(before);
  });

  it("splits rewards pro-rata between multiple stakers", async () => {
    const { staking, alice, bob } = await deployFixture();
    await staking.connect(alice).stake(ethers.parseEther("100"));
    await staking.connect(bob).stake(ethers.parseEther("100"));

    await network.provider.send("evm_increaseTime", [100]);
    await network.provider.send("evm_mine");

    const aliceEarned = await staking.earned(alice.address);
    const bobEarned = await staking.earned(bob.address);
    expect(aliceEarned).to.be.closeTo(bobEarned, ethers.parseEther("1"));
  });

  it("blocks new stakes while paused but still allows unstaking", async () => {
    const { staking, alice } = await deployFixture();
    await staking.connect(alice).stake(ethers.parseEther("50"));
    await staking.pause();

    await expect(
      staking.connect(alice).stake(ethers.parseEther("10"))
    ).to.be.revertedWithCustomError(staking, "EnforcedPause");
    await expect(staking.connect(alice).unstake(ethers.parseEther("10"))).to.not.be.reverted;
  });

  it("reverts when a non-admin changes the reward rate", async () => {
    const { staking, alice } = await deployFixture();
    await expect(staking.connect(alice).setRewardRate(1n)).to.be.revertedWithCustomError(
      staking,
      "AccessControlUnauthorizedAccount"
    );
  });
});
