import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const name = "My Token";
  const symbol = "MTK";
  const initialSupply = hre.ethers.parseEther("1000000");

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(name, symbol, initialSupply);
  await token.waitForDeployment();

  return {
    MyToken: {
      address: await token.getAddress(),
      constructorArguments: [name, symbol, initialSupply.toString()],
    },
  };
}
