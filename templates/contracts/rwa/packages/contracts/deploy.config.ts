import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const name = "Main Street Property Shares";
  const symbol = "MSPS";
  const initialPricePerShare = 10_000; // $100.00 expressed in cents

  const assetId = "MSPS-001";
  const assetType = "Commercial Real Estate";
  const initialValuation = hre.ethers.parseEther("1000000"); // 1M units
  const custodian = hre.ethers.ZeroAddress; // Will be set to proper custodian

  console.log("Deploying RWAToken...");
  const RWAToken = await hre.ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy(name, symbol);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("RWAToken deployed:", tokenAddress);

  console.log("Deploying RWAAssetManager...");
  const RWAAssetManager = await hre.ethers.getContractFactory("RWAAssetManager");
  const assetManager = await RWAAssetManager.deploy(
    assetId,
    assetType,
    initialValuation,
    custodian,
    initialPricePerShare
  );
  await assetManager.waitForDeployment();
  const assetManagerAddress = await assetManager.getAddress();
  console.log("RWAAssetManager deployed:", assetManagerAddress);

  console.log("Deploying RWACompliance...");
  const RWACompliance = await hre.ethers.getContractFactory("RWACompliance");
  const compliance = await RWACompliance.deploy();
  await compliance.waitForDeployment();
  const complianceAddress = await compliance.getAddress();
  console.log("RWACompliance deployed:", complianceAddress);

  console.log("Deploying RWAAssetLifecycle...");
  const RWAAssetLifecycle = await hre.ethers.getContractFactory("RWAAssetLifecycle");
  const lifecycle = await RWAAssetLifecycle.deploy();
  await lifecycle.waitForDeployment();
  const lifecycleAddress = await lifecycle.getAddress();
  console.log("RWAAssetLifecycle deployed:", lifecycleAddress);

  console.log("Deploying RWADistribution...");
  const RWADistribution = await hre.ethers.getContractFactory("RWADistribution");
  const distribution = await RWADistribution.deploy(tokenAddress);
  await distribution.waitForDeployment();
  const distributionAddress = await distribution.getAddress();
  console.log("RWADistribution deployed:", distributionAddress);

  return {
    RWAToken: {
      address: tokenAddress,
      constructorArguments: [name, symbol],
    },
    RWAAssetManager: {
      address: assetManagerAddress,
      constructorArguments: [assetId, assetType, initialValuation.toString(), custodian, initialPricePerShare],
    },
    RWACompliance: {
      address: complianceAddress,
      constructorArguments: [],
    },
    RWAAssetLifecycle: {
      address: lifecycleAddress,
      constructorArguments: [],
    },
    RWADistribution: {
      address: distributionAddress,
      constructorArguments: [tokenAddress],
    },
  };
}
