import { expect } from "chai";
import { ethers } from "hardhat";

describe("RWAShareToken", () => {
  async function deployFixture() {
    const [admin, holderA, holderB, stranger] = await ethers.getSigners();
    const RWAShareToken = await ethers.getContractFactory("RWAShareToken");
    const token = await RWAShareToken.deploy("Main Street Property Shares", "MSPS", 10_000);
    await token.waitForDeployment();

    await token.setWhitelisted(holderA.address, true);
    await token.setWhitelisted(holderB.address, true);

    return { token, admin, holderA, holderB, stranger };
  }

  it("sets the initial NAV", async () => {
    const { token } = await deployFixture();
    expect(await token.pricePerShare()).to.equal(10_000n);
  });

  it("lets MINTER_ROLE issue shares to a whitelisted holder", async () => {
    const { token, holderA } = await deployFixture();
    await token.issue(holderA.address, ethers.parseEther("10"));
    expect(await token.balanceOf(holderA.address)).to.equal(ethers.parseEther("10"));
  });

  it("blocks issuing shares to a non-whitelisted address", async () => {
    const { token, stranger } = await deployFixture();
    await expect(token.issue(stranger.address, 1n)).to.be.revertedWith(
      "RWAShareToken: recipient not whitelisted"
    );
  });

  it("allows transfers between whitelisted holders only", async () => {
    const { token, holderA, holderB, stranger } = await deployFixture();
    await token.issue(holderA.address, ethers.parseEther("10"));

    await expect(token.connect(holderA).transfer(holderB.address, ethers.parseEther("1"))).to.not
      .be.reverted;

    await expect(
      token.connect(holderA).transfer(stranger.address, ethers.parseEther("1"))
    ).to.be.revertedWith("RWAShareToken: recipient not whitelisted");
  });

  it("burns shares and emits a redemption request", async () => {
    const { token, holderA } = await deployFixture();
    await token.issue(holderA.address, ethers.parseEther("5"));

    await expect(token.connect(holderA).requestRedemption(ethers.parseEther("2")))
      .to.emit(token, "RedemptionRequested")
      .withArgs(holderA.address, ethers.parseEther("2"), 1n);

    expect(await token.balanceOf(holderA.address)).to.equal(ethers.parseEther("3"));
  });

  it("lets ORACLE_ROLE update the NAV", async () => {
    const { token } = await deployFixture();
    await expect(token.setPricePerShare(11_000))
      .to.emit(token, "PriceUpdated")
      .withArgs(10_000n, 11_000n);
    expect(await token.pricePerShare()).to.equal(11_000n);
  });

  it("reverts when a non-compliance account edits the whitelist", async () => {
    const { token, stranger } = await deployFixture();
    await expect(
      token.connect(stranger).setWhitelisted(stranger.address, true)
    ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });
});
