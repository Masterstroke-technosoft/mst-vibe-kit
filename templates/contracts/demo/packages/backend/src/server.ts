import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";

// Secrets live at the repo root, not in packages/backend.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

import { gatewayUrl, pinFileToIPFS, pinJSONToIPFS } from "./pinata";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, pinataConfigured: Boolean(process.env.PINATA_JWT) });
});

/**
 * Accepts an NFT image plus name/description, pins the image to IPFS via
 * Pinata, builds ERC-721 metadata pointing at it, pins the metadata too,
 * and returns the resulting `ipfs://` token URI for `DemoNFT.mint`.
 */
app.post("/api/mint-metadata", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Missing `image` file in form data." });
    }

    const name = (req.body.name || "").toString().trim() || "Untitled DemoNFT";
    const description = (req.body.description || "").toString().trim();

    const imageCid = await pinFileToIPFS(file.buffer, file.originalname, file.mimetype);
    const imageUri = `ipfs://${imageCid}`;

    const metadataCid = await pinJSONToIPFS({
      name,
      description,
      image: imageUri,
    });

    res.json({
      tokenURI: `ipfs://${metadataCid}`,
      imageUri,
      imageGatewayUrl: gatewayUrl(imageCid),
      metadataGatewayUrl: gatewayUrl(metadataCid),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Demo backend listening on http://localhost:${PORT}`);
});
