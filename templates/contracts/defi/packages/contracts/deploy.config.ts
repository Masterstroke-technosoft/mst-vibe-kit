import type { HardhatRuntimeEnvironment } from "hardhat/types";

const DAY = 24 * 60 * 60;

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();

  const tokenName = "Project Token";
  const tokenSymbol = "PROJ";
  const initialSupply = hre.ethers.parseEther("1000000");

  const ProjectToken = await hre.ethers.getContractFactory("ProjectToken");
  const projectToken = await ProjectToken.deploy(tokenName, tokenSymbol, initialSupply);
  await projectToken.waitForDeployment();
  const tokenAddress = await projectToken.getAddress();

  const rewardRatePerSecond = hre.ethers.parseEther("0.01"); // split pro-rata across all stakers
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(tokenAddress, rewardRatePerSecond);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  const Vesting = await hre.ethers.getContractFactory("Vesting");
  const vesting = await Vesting.deploy(tokenAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();

  // Fund the staking pool's reward reserve — rewards are paid out of the
  // contract's own token balance, separate from what stakers deposit.
  const rewardReserve = hre.ethers.parseEther("100000");
  await (await projectToken.transfer(stakingAddress, rewardReserve)).wait();

  // Create an example 30-day vesting schedule for the deployer so the frontend
  // has something to display right after the first deploy.
  const vestAmount = hre.ethers.parseEther("10000");
  await (await projectToken.approve(vestingAddress, vestAmount)).wait();
  const start = Math.floor(Date.now() / 1000);
  await (
    await vesting.createSchedule(deployer.address, vestAmount, start, 0, 30 * DAY, true)
  ).wait();

  return {
    ProjectToken: {
      address: tokenAddress,
      constructorArguments: [tokenName, tokenSymbol, initialSupply.toString()],
    },
    Staking: {
      address: stakingAddress,
      constructorArguments: [tokenAddress, rewardRatePerSecond.toString()],
    },
    Vesting: {
      address: vestingAddress,
      constructorArguments: [tokenAddress],
    },
  };
}
