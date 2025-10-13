/** @type {import('next').NextConfig} */
const nextConfig = {
  // DO NOT set output: 'export'
  // If you want something explicit, use:
  // output: 'standalone',
  reactStrictMode: true,
  // (optional) to avoid ESLint blocking builds:
  // eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
};

export default nextConfig;
