const http = require('http');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const { env, validateEnv } = require('./config/env');
const socketService = require('./services/socketService');
const schedulerService = require('./services/schedulerService');

let server;

const shutdown = (signal) => {
  console.log(`${signal} received. Closing ${env.appName} API server.`);

  schedulerService.stopAll();

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    process.exit(0);
  });
};

const startServer = async () => {
  validateEnv();

  // Create HTTP server so Socket.IO can attach to it
  server = http.createServer(app);

  // Attach Socket.IO
  socketService.init(server);

  // Register and start all cron jobs
  schedulerService.initJobs({ socketService });
  schedulerService.startAll();

  if (env.nodeEnv === 'production') {
    await connectDB();
    server.listen(env.port, () => {
      console.log(`${env.appName} API running in ${env.nodeEnv} mode on port ${env.port}`);
    });
    return;
  }

  server.listen(env.port, () => {
    console.log(`${env.appName} API running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  connectDB().catch((error) => {
    console.warn(`Database connection skipped in development: ${error.message}`);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled promise rejection: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

startServer().catch((error) => {
  console.error(`Failed to start ${env.appName} API: ${error.message}`);
  process.exit(1);
});
