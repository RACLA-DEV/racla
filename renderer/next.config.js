module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  // images: {
  //   domains: ['cdn.racla.app', 'origin.lunatica.kr'],
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'cdn.racla.app',
  //       pathname: '/**',
  //     },
  //   ],
  // },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config) => {
    return config
  },
}
