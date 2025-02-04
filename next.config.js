/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
        pathname: '/images/**',
      },
    ],
  },

  // 静态资源优化
  experimental: {
    optimizeCss: true, // 启用CSS优化
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'], // 优化图标库导入
  },

  // 资源压缩
  compress: true,

  // 生产环境优化
  productionBrowserSourceMaps: false,
  swcMinify: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };

      // Enable Web Assembly
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }

    return config;
  },
}

module.exports = nextConfig
