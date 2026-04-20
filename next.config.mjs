const nextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
        source: "/:path*",
      },
    ]
  },
}

export default nextConfig
