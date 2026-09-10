import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow other devices on the LAN to use the site in development
  allowedDevOrigins: [
    "192.168.1.121",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
