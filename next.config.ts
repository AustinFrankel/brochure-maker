import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Without this, Next walks up to the home directory looking for a lockfile.
  turbopack: { root: __dirname },
  // Chromium is loaded at runtime by the export route, not bundled.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
};

export default nextConfig;
