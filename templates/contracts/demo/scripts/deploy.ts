import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const DemoNFT = await hre.ethers.getContractFactory("DemoNFT");

  const nft = await DemoNFT.deploy();

  await nft.waitForDeployment();

  return {
    DemoNFT: {
      address: await nft.getAddress(),
      constructorArguments: [],
    },
  };
}