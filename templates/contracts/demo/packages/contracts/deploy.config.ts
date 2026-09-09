import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const { ethers } = await import("hardhat");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying DemoNFT...");
  console.log("Deployer:", deployer.address);

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

  const address = await demoNFT.getAddress();

  console.log("DemoNFT deployed to:", address);

  return {
    demoNFT: address,
  };
}