import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER

  return {
    // 웹 최적화 설정
    output: 'standalone',
    poweredByHeader: false,
    reactStrictMode: true,

    // 이미지 최적화
    images: {
      domains: ['ribbon.r-archive.zip', 'origin.lunatica.kr'],
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
      imageSizes: [16, 32, 48, 64, 96, 128, 256],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'ribbon.r-archive.zip',
          pathname: '/**',
        },
      ],
    },

    // 성능 최적화
    compiler: {
      removeConsole: !isDev,
    },

    // 웹팩 설정
    webpack: (config, { dev, isServer }) => {
      // 프로덕션 빌드 최적화
      if (!dev && !isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        }
      }

      return config
    },
  }
}

export default nextConfig
