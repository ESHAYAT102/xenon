import withPWA from "@ducanh2912/next-pwa"

const nextConfig = {
  turbopack: {},
}

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  fallbacks: {
    document: "/~offline",
  },
})

export default withPWAConfig(nextConfig)
