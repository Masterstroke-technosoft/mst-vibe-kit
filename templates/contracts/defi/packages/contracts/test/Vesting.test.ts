import { expect } from "chai";
import { ethers, network } from "hardhat";

const DAY = 24 * 60 * 60;

describe("Vesting", () => {
  async function deployFixture() {
    const [admin, beneficiary] = await ethers.getSigners();

    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    const token = await ProjectToken.deploy(
      "Project Token",
      "PROJ",
      ethers.parseEther("1000000")
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(tokenAddress);
    await vesting.waitForDeployment();
    const vestingAddress = await vesting.getAddress();

    await token.approve(vestingAddress, ethers.MaxUint256);

    return { token, vesting, admin, beneficiary };
  }

  it("vests nothing before the cliff", async () => {
    const { vesting, beneficiary } = await deployFixture();
    const start = (await ethers.provider.getBlock("latest"))!.timestamp;
    await vesting.createSchedule(
      beneficiary.address,
      ethers.parseEther("1000"),
      start,
      10 * DAY,
      100 * DAY,
      true
    );

    expect(await vesting.releasableAmount(beneficiary.address)).to.equal(0n);
  });

  it("releases proportionally to elapsed time after the cliff", async () => {
    const { vesting, beneficiary } = await deployFixture();
    const start = (await ethers.provider.getBlock("latest"))!.timestamp;
    await vesting.createSchedule(
      beneficiary.address,
      ethers.parseEther("1000"),
      start,
      0,
      100 * DAY,
      true
    );

    await network.provider.send("evm_increaseTime", [50 * DAY]);
    await network.provider.send("evm_mine");

    const releasable = await vesting.releasableAmount(beneficiary.address);
    expect(releasable).to.be.closeTo(ethers.parseEther("500"), ethers.parseEther("5"));
  });

  it("lets the beneficiary release vested tokens", async () => {
    const { token, vesting, beneficiary } = await deployFixture();
    const start = (await ethers.provider.getBlock("latest"))!.timestamp;
    await vesting.createSchedule(
      beneficiary.address,
      ethers.parseEther("1000"),
      start,
      0,
      100 * DAY,
      true
    );

    await network.provider.send("evm_increaseTime", [100 * DAY]);
    await network.provider.send("evm_mine");

    await vesting.connect(beneficiary).release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(ethers.parseEther("1000"));
  });

  it("lets an admin revoke and refunds the unvested balance", async () => {
    const { token, vesting, admin, beneficiary } = await deployFixture();
    const start = (await ethers.provider.getBlock("latest"))!.timestamp;
    await vesting.createSchedule(
      beneficiary.address,
      ethers.parseEther("1000"),
      start,
      0,
      100 * DAY,
      true
    );

    await network.provider.send("evm_increaseTime", [50 * DAY]);
    await network.provider.send("evm_mine");

    const adminBalanceBefore = await token.balanceOf(admin.address);
    await vesting.revoke(beneficiary.address);
    const adminBalanceAfter = await token.balanceOf(admin.address);

    expect(adminBalanceAfter).to.be.gt(adminBalanceBefore);
    expect(await vesting.releasableAmount(beneficiary.address)).to.equal(0n);
  });

  it("reverts creating a second schedule for the same beneficiary", async () => {
    const { vesting, beneficiary } = await deployFixture();
    const start = (await ethers.provider.getBlock("latest"))!.timestamp;
    await vesting.createSchedule(
      beneficiary.address,
      ethers.parseEther("100"),
      start,
      0,
      10 * DAY,
      true
    );
    await expect(
      vesting.createSchedule(beneficiary.address, ethers.parseEther("100"), start, 0, 10 * DAY, true)
    ).to.be.revertedWith("Vesting: schedule exists");
  });
});
