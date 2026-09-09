const PINATA_API = "https://api.pinata.cloud";

function requireJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "PINATA_JWT is not set. Get one at https://app.pinata.cloud/developers/api-keys and add it to .env.local",
    );
  }
  return jwt;
}

export function gatewayUrl(cid: string): string {
  const gateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
  return `https://${gateway}/ipfs/${cid}`;
}

export async function pinFileToIPFS(
  file: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const jwt = requireJwt();

  const form = new FormData();
  form.append("file", new Blob([file], { type: mimeType }), filename);

  const response = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinata file upload failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

export async function pinJSONToIPFS(
  json: Record<string, unknown>,
): Promise<string> {
  const jwt = requireJwt();

  const response = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinata JSON upload failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  return data.IpfsHash;
}
