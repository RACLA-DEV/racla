module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  // images: {
  //   domains: ['ribbon.r-archive.zip', 'origin.lunatica.kr'],
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'ribbon.r-archive.zip',
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
