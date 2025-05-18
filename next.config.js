const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  env: {
    // These will be available on the client-side as process.env.NEXT_PUBLIC_*
    NEXT_PUBLIC_NEO4J_URL: process.env.NEO4J_URL,
    NEXT_PUBLIC_NEO4J_USERNAME: process.env.NEO4J_USERNAME,
    NEXT_PUBLIC_NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
  },
})