import { expect } from "chai";
import { ethers } from "hardhat";

describe("ProjectToken", () => {
  it("mints the initial supply to the deployer", async () => {
    const [deployer] = await ethers.getSigners();
    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    const token = await ProjectToken.deploy("Project Token", "PROJ", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    expect(await token.balanceOf(deployer.address)).to.equal(ethers.parseEther("1000000"));
  });

  it("reverts when a non-minter mints", async () => {
    const [, other] = await ethers.getSigners();
    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    const token = await ProjectToken.deploy("Project Token", "PROJ", 0n);
    await token.waitForDeployment();
    await expect(token.connect(other).mint(other.address, 1n)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );
  });
});
