module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  // images: {
  //   domains: ['cdn.lunatica.kr', 'origin.lunatica.kr'],
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'cdn.lunatica.kr',
  //       pathname: '/**',
  //     },
  //   ],
  // },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
}
