/** @type {import('next').NextConfig} */

// ----------------------------------------------------------------------------
// GitHub Pages static-export configuration.
//
// For a *project* site (https://<user>.github.io/<repo>) you must serve the app
// from a sub-path. Set the repo name here, or override it from the environment
// (the deploy workflow exports NEXT_PUBLIC_BASE_PATH automatically).
//
//   • Local dev / user-or-org site at the domain root  ->  leave this empty.
//   • Project site under /<repo>                        ->  set "/cyber-study-hub".
// ----------------------------------------------------------------------------
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Emit /cheatsheet/<id>/index.html so GitHub Pages serves clean URLs.
  trailingSlash: true,
};

module.exports = nextConfig;
