/**
 * Custom Next.js Server with Auto-Startup
 * This server automatically starts all monitoring and data quality services
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT) || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import startup service (will be available after Next.js is ready)
let autoStartupService = null;

app.prepare().then(async () => {
  console.log('🚀 Next.js server preparing...');
  
  // Import and initialize background sync service
  try {
    const { backgroundSyncService } = require('./dist/server/background-sync-service.js');
    autoStartupService = backgroundSyncService;
    console.log('✅ Background sync service loaded');
  } catch (error) {
    console.error('❌ Failed to load background sync service:', error);
    console.log('⚠️ Continuing without background sync services...');
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

  // Start server with graceful port handling
  const startServer = (attemptPort) => {
    server.listen(attemptPort, hostname, (err) => {
      if (err) {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${attemptPort} is in use, trying ${attemptPort + 1}...`);
          startServer(attemptPort + 1);
          return;
        }
        throw err;
      }
      
      console.log(`> Ready on http://${hostname}:${attemptPort}`);
      console.log('🎉 Server started successfully!');
      
      // Initialize background sync service after server is ready
      const isVercel = !!process.env.VERCEL
      const allowBackgroundSync = !isVercel
      if (autoStartupService && allowBackgroundSync) {
        setTimeout(async () => {
          try {
            console.log('🚀 Starting background sync service...');
            await autoStartupService.start();
            console.log('✅ Background sync service started successfully!');
          } catch (error) {
            console.error('❌ Background sync startup failed:', error);
          }
        }, 3000); // Wait 3 seconds after server starts
      } else if (isVercel) {
        console.log('ℹ️ Background sync disabled on Vercel environment')
      }
    });
  };
  
  startServer(port);

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
