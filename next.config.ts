import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/manager/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
