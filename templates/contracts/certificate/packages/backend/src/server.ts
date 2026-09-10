import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { deployments } from "{{PROJECT_NAME}}-shared";

// Secrets live at the repo root, not in packages/backend.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

import { mstMainnet, mstTestnet } from "./chains";
import { buildTokenURI, hashCertificate } from "./certificateMetadata";

const NETWORK = process.env.NETWORK === "mainnet" ? "mainnet" : "testnet";
const chain = NETWORK === "mainnet" ? mstMainnet : mstTestnet;

const contract = (deployments as Record<string, any>)[NETWORK]?.Certificate as
  | { address: Address; abi: any }
  | undefined;

const issuerPrivateKey = process.env.ISSUER_PRIVATE_KEY as `0x${string}` | undefined;
const issuerAccount = issuerPrivateKey ? privateKeyToAccount(issuerPrivateKey) : undefined;

const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = issuerAccount
  ? createWalletClient({ chain, transport: http(), account: issuerAccount })
  : undefined;

function requireContract() {
  if (!contract) {
    throw new Error(
      `No Certificate deployment found for network "${NETWORK}". Run \`npm run deploy:${NETWORK}\` first.`,
    );
  }
  return contract;
}

function requireIssuer() {
  if (!issuerAccount || !walletClient) {
    throw new Error(
      "ISSUER_PRIVATE_KEY is not set. Generate a wallet for the backend, add it to .env.local, " +
        "and have the contract owner grant it issuer rights via setIssuer.",
    );
  }
  return { issuerAccount, walletClient };
}

/**
 * Pulls tokenId(s) out of a receipt's CertificateIssued events. Minting
 * also emits an ERC721 `Transfer` log per token at the same address, so
 * `eventName` is left for decodeEventLog to infer from the log's own topic0
 * rather than forced — forcing it would decode every log (Transfer
 * included) as if it were CertificateIssued, double-counting each token.
 */
function extractTokenIds(abi: any, contractAddress: Address, logs: readonly any[]): bigint[] {
  const tokenIds: bigint[] = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi, ...log });
      if (decoded.eventName !== "CertificateIssued") continue;
      tokenIds.push((decoded.args as any).tokenId as bigint);
    } catch {
      // Not a log this ABI recognizes — ignore.
    }
  }
  return tokenIds;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const base = { ok: true, network: NETWORK, contractAddress: contract?.address ?? null };

  if (!contract || !issuerAccount) {
    return res.json({
      ...base,
      issuerAddress: issuerAccount?.address ?? null,
      isIssuerConfigured: false,
    });
  }

  try {
    const isIssuer = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "isIssuer",
      args: [issuerAccount.address],
    });
    res.json({ ...base, issuerAddress: issuerAccount.address, isIssuerConfigured: isIssuer });
  } catch (error) {
    res.status(500).json({
      ...base,
      issuerAddress: issuerAccount.address,
      error: error instanceof Error ? error.message : "Failed to read issuer status",
    });
  }
});

/**
 * Issues one certificate using the server-held issuer wallet — no browser
 * wallet connection required. `to` must be provided; the certificate
 * fingerprint and metadata are built the same way as the frontend's
 * wallet-based Issue Certificate form.
 */
app.post("/api/issue", async (req, res) => {
  try {
    const { address: contractAddress, abi } = requireContract();
    const { walletClient: signer, issuerAccount: account } = requireIssuer();

    const { to, holderName, credential, issuedOn } = req.body ?? {};
    if (!to || !holderName || !credential || !issuedOn) {
      return res
        .status(400)
        .json({ error: "Missing one of: to, holderName, credential, issuedOn" });
    }

    const certHash = hashCertificate({ holderName, credential, issuedOn });
    const tokenURI = buildTokenURI(holderName, credential, issuedOn);

    const hash = await signer.writeContract({
      address: contractAddress,
      abi,
      functionName: "issue",
      args: [to as Address, certHash, tokenURI],
      account,
      chain,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const [tokenId] = extractTokenIds(abi, contractAddress, receipt.logs);

    res.json({ txHash: hash, tokenId: tokenId?.toString() ?? null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Issue failed" });
  }
});

/**
 * Issues many certificates in one transaction from the server-held issuer
 * wallet — the automated equivalent of the Batch Issue form.
 */
app.post("/api/batch-issue", async (req, res) => {
  try {
    const { address: contractAddress, abi } = requireContract();
    const { walletClient: signer, issuerAccount: account } = requireIssuer();

    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Body must include a non-empty `rows` array." });
    }

    const to: Address[] = [];
    const certHashes: `0x${string}`[] = [];
    const tokenURIs: string[] = [];

    for (const row of rows) {
      if (!row?.to || !row?.holderName || !row?.credential || !row?.issuedOn) {
        return res.status(400).json({
          error: "Each row needs to, holderName, credential, and issuedOn.",
        });
      }
      to.push(row.to as Address);
      certHashes.push(hashCertificate(row));
      tokenURIs.push(buildTokenURI(row.holderName, row.credential, row.issuedOn));
    }

    const hash = await signer.writeContract({
      address: contractAddress,
      abi,
      functionName: "batchIssue",
      args: [to, certHashes, tokenURIs],
      account,
      chain,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenIds = extractTokenIds(abi, contractAddress, receipt.logs);

    res.json({ txHash: hash, tokenIds: tokenIds.map((id) => id.toString()) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Batch issue failed" });
  }
});

const PORT = Number(process.env.PORT) || 4100;

app.listen(PORT, () => {
  console.log(`Certificate backend listening on http://localhost:${PORT} (network: ${NETWORK})`);
});
