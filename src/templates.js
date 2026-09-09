// Registry of contract templates the CLI can scaffold. Each id must have a
// matching directory at templates/contracts/<id> that overlays templates/base.
export const TEMPLATES = [
  {
    id: "blank",
    title: "blank",
    standard: "—",
    description: "Empty Hardhat config + Hello.sol example",
  },
  {
    id: "token",
    title: "token",
    standard: "MEP-20",
    description: "Fungible token with mint/burn roles, full test suite",
  },
  {
    id: "rwa",
    title: "rwa",
    standard: "Permissioned ERC-20",
    description:
      "Whitelist-gated share token for real-world-asset tokenization, with NAV pricing and redemption requests",
  },
  {
    id: "defi",
    title: "defi",
    standard: "Staking + Vesting",
    description:
      "Reward-accruing staking pool and linear token vesting, sharing one project ERC-20",
  },
   {
    id: "demo",
    title: "demo",
    standard: "NFT + MST SDK",
    description:
      "Basic NFT minting with image metadata, MST SDK wallet operations, and a frontend playground",
  },
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id);
}
