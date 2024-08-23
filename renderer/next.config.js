module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
  // async rewrites() {
  //   return {
  //     beforeFiles: [
  //       {
  //         source: '/varchive/client/:path*',
  //         destination: 'https://v-archive.net/client/:path*',
  //       },
  //     ],
  //   }
  // },
}
