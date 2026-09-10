import { keccak256, toBytes } from "viem";

export type CertificateFields = {
  holderName: string;
  credential: string;
  issuedOn: string;
};

/**
 * Mirrors packages/frontend/lib/certificateHash.ts exactly — same fields,
 * same trim/join order — so a certificate issued from the backend hashes
 * identically to one issued from the browser.
 */
export function hashCertificate(fields: CertificateFields): `0x${string}` {
  const canonical = [fields.holderName, fields.credential, fields.issuedOn]
    .map((value) => value.trim())
    .join("|");

  return keccak256(toBytes(canonical));
}

/** Mirrors buildTokenURI() in packages/frontend/components/IssuePanel.tsx. */
export function buildTokenURI(holderName: string, credential: string, issuedOn: string): string {
  const metadata = {
    name: credential,
    description: `Issued to ${holderName} on ${issuedOn}.`,
    holderName,
    credential,
    issuedOn,
  };
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(metadata))}`;
}
