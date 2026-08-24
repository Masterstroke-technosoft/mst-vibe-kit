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
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id);
}
