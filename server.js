/**
 * Custom Next.js Server with Auto-Startup
 * This server automatically starts all monitoring and data quality services
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import startup service (will be available after Next.js is ready)
let autoStartupService = null;

app.prepare().then(async () => {
  console.log('🚀 Next.js server preparing...');
  
  // Import and initialize auto-startup service
  try {
    const { autoStartupService: startupService } = require('./dist/server/startup.js');
    autoStartupService = startupService;
    console.log('✅ Auto-startup service loaded');
  } catch (error) {
    console.error('❌ Failed to load auto-startup service:', error);
    console.log('⚠️ Continuing without auto-startup services...');
  }

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('🎉 Server started successfully!');
    
    // Initialize services after server is ready
    if (autoStartupService) {
      setTimeout(async () => {
        try {
          console.log('🚀 Starting auto-startup services...');
          await autoStartupService.initialize({
            enableMonitoring: true,
            monitoringIntervalMinutes: 5,
            enableDataQualityChecks: true,
            enableHealthChecks: true,
            enableAutoCleanup: false,
            startupDelay: 2000
          });
          console.log('✅ All services started automatically!');
        } catch (error) {
          console.error('❌ Auto-startup failed:', error);
        }
      }, 3000); // Wait 3 seconds after server starts
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    if (autoStartupService) {
      autoStartupService.stop();
    }
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    if (autoStartupService) {
      autoStartupService.stop();
    }
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});
