/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable proper linting and type checking
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks'],
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'cdn.nba.com',
      },
      {
        protocol: 'https',
        hostname: 'espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 80, 90, 95, 100],
  },
  // Optimize performance
  poweredByHeader: false,
  compress: true,
  // Enable experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-tooltip'
    ],
  },
  // Configure allowed development origins for cross-origin requests
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.197'],
  // Webpack optimizations - simplified to prevent module resolution issues
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production builds
    if (!dev && !isServer) {
      // Simplified chunk splitting to prevent module resolution issues
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      }
    }
    
    // Simplified cache configuration
    if (config.cache && config.cache.type === 'filesystem') {
      config.cache.maxMemoryGenerations = 1
      config.cache.maxAge = 1000 * 60 * 60 * 24 // 1 day
    }
    
    // Reduce logging verbosity
    config.infrastructureLogging = {
      level: 'warn',
    }
    
    return config
  },
  // Reduce bundle size - removed standalone output for Vercel compatibility
}

export default nextConfig
