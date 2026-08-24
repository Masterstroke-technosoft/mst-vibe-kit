import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const name = "Main Street Property Shares";
  const symbol = "MSPS";
  const initialPricePerShare = 10_000; // $100.00 expressed in cents

  const RWAShareToken = await hre.ethers.getContractFactory("RWAShareToken");
  const token = await RWAShareToken.deploy(name, symbol, initialPricePerShare);
  await token.waitForDeployment();

  return {
    RWAShareToken: {
      address: await token.getAddress(),
      constructorArguments: [name, symbol, initialPricePerShare],
    },
  };
}
