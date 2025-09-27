// next.config.mjs
import path from "path";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";

const isStaticExport = isGitHubActions && process.env.NEXT_STATIC_EXPORT === "true";

/** @type {import('next').NextConfig} */
const tracingRoot = process.env.VERCEL ? process.cwd() : path.join(__dirname, "..");

const nextConfig = {
  outputFileTracingRoot: tracingRoot,
  images: { unoptimized: isStaticExport },
  ...(isStaticExport
    ? {
        output: "export",
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
