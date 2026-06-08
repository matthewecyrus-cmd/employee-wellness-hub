import type { Express, Request, Response } from "express";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

/**
 * POST /api/upload/tipsheet
 *
 * Accepts a base64-encoded file from the admin UI, uploads it to S3 storage,
 * and returns the URL. Only accessible to authenticated admin users.
 *
 * Body: { fileName: string; mimeType: string; dataBase64: string }
 * Response: { url: string; key: string }
 */
export function registerUploadRoute(app: Express): void {
  app.post("/api/upload/tipsheet", async (req: Request, res: Response) => {
    // Authenticate — only logged-in admins can upload
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { fileName, mimeType, dataBase64 } = req.body as {
      fileName?: string;
      mimeType?: string;
      dataBase64?: string;
    };

    if (!fileName || !mimeType || !dataBase64) {
      res.status(400).json({ error: "fileName, mimeType, and dataBase64 are required" });
      return;
    }

    // Validate MIME type — only allow PDF and common document types
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      res.status(400).json({ error: "Only PDF and image files are allowed" });
      return;
    }

    // Limit size — base64 of 10MB is ~13.3MB of string
    if (dataBase64.length > 14_000_000) {
      res.status(400).json({ error: "File too large (max 10 MB)" });
      return;
    }

    try {
      const buffer = Buffer.from(dataBase64, "base64");
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `tipsheets/${safeFileName}`;
      const { key, url } = await storagePut(storageKey, buffer, mimeType);
      res.json({ url, key });
    } catch (err) {
      console.error("[Upload] Error uploading file:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}
