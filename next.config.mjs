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
    unoptimized: true,
    domains: ['localhost', new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname],
    formats: ['image/webp', 'image/avif'],
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
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    
    // Optimize cache serialization to avoid large string warnings
    if (config.cache && config.cache.type === 'filesystem') {
      config.cache.maxMemoryGenerations = 1
      config.cache.maxAge = 1000 * 60 * 60 * 24 * 7 // 7 days
      // Reduce cache warnings by optimizing serialization
      config.cache.compression = 'gzip'
      config.cache.store = 'pack'
    }
    
    // Suppress webpack cache warnings for large strings
    config.infrastructureLogging = {
      level: 'error',
      debug: false
    }
    
    return config
  },
  // Reduce bundle size - removed standalone output for Vercel compatibility
}

export default nextConfig
