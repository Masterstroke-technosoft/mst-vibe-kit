import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken", () => {
  async function deployFixture() {
    const [admin, user, other] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy("My Token", "MTK", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    return { token, admin, user, other };
  }

  it("mints the initial supply to the deployer", async () => {
    const { token, admin } = await deployFixture();
    expect(await token.balanceOf(admin.address)).to.equal(ethers.parseEther("1000000"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
  });

  it("lets an account with MINTER_ROLE mint new tokens", async () => {
    const { token, user } = await deployFixture();
    await token.mint(user.address, ethers.parseEther("100"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
  });

  it("reverts when a non-minter tries to mint", async () => {
    const { token, other, user } = await deployFixture();
    await expect(token.connect(other).mint(user.address, 1n)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("lets an account with BURNER_ROLE burn tokens", async () => {
    const { token, admin } = await deployFixture();
    await token.burn(admin.address, ethers.parseEther("1"));
    expect(await token.balanceOf(admin.address)).to.equal(ethers.parseEther("999999"));
  });

  it("blocks transfers while paused", async () => {
    const { token, admin, user } = await deployFixture();
    await token.pause();
    await expect(token.transfer(user.address, 1n)).to.be.revertedWithCustomError(
      token,
      "EnforcedPause"
    );
    await token.unpause();
    await expect(token.transfer(user.address, 1n)).to.not.be.reverted;
  });
});
