import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const { ethers } = await import("hardhat");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying ParametricInsurance...");
  console.log("Deployer:", deployer.address);

  const ParametricInsurance = await ethers.getContractFactory("ParametricInsurance");

  // The deployer is the initial oracle — reassign with `setOracle` once a
  // real data-reporting address (or oracle service) is ready.
  const insurance = await ParametricInsurance.deploy(deployer.address);

  await insurance.waitForDeployment();

  const address = await insurance.getAddress();

  console.log("ParametricInsurance deployed to:", address);

  return {
    ParametricInsurance: {
      address,
      constructorArguments: [deployer.address],
    },
  };
}
