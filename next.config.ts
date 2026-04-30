import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel Blob requires no special config — just the BLOB_READ_WRITE_TOKEN env var
  // Suppress TS errors for server-only modules used in route handlers
  serverExternalPackages: [],
};

export default nextConfig;
