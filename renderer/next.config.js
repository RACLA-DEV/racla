// const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'export',
//   distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
//   trailingSlash: true,
//   images: {
//     unoptimized: true,
//   },
//   webpack: (config) => {
//     return config
//   },
// }

// module.exports = (phase) => {
//   if (phase === PHASE_DEVELOPMENT_SERVER) {
//     /** @type {import('next').NextConfig} */
//     return {
//       ...nextConfig,
//       async rewrites() {
//         return {
//           beforeFiles: [
//             {
//               source: '/varchive/client/:path*',
//               destination: 'https://v-archive.net/client/:path*',
//             },
//           ],
//         }
//       },
//     }
//   } else {
//     /** @type {import('next').NextConfig} */
//     return {
//       ...nextConfig,
//     }
//   }
// }

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
