const mongoose = require('mongoose');
const { env, localMongoUri } = require('./env');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectionOptions = {
  autoIndex: env.nodeEnv !== 'production',
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: env.nodeEnv === 'production' ? 15 : 5,
  minPoolSize: 0,
  retryWrites: true,
  retryReads: true,
};

const connectDB = async () => {
  if (!env.mongoUri) {
    if (env.nodeEnv === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }

    console.warn('MONGODB_URI is not set. Database-backed routes need a local MongoDB connection.');
    return null;
  }

  mongoose.set('strictQuery', true);

  const attempts = env.nodeEnv === 'production' ? 3 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await mongoose.connect(env.mongoUri, connectionOptions);

      console.log(`MongoDB connected: ${connection.connection.host}`);
      return connection;
    } catch (error) {
      const isAuthFailure = /bad auth|authentication failed/i.test(error.message || '');

      if (env.nodeEnv !== 'production' && isAuthFailure && env.mongoUri !== localMongoUri) {
        try {
          console.warn('Atlas credentials were rejected. Falling back to local MongoDB for development.');
          const localConnection = await mongoose.connect(localMongoUri, connectionOptions);
          console.log(`MongoDB connected: ${localConnection.connection.host}`);
          return localConnection;
        } catch (localError) {
          console.warn(`Local MongoDB fallback unavailable: ${localError.message}`);
        }
      }

      if (attempt >= attempts) {
        if (env.nodeEnv === 'production') {
          throw error;
        }

        console.warn(`MongoDB connection unavailable: ${error.message}`);
        console.warn(`${env.appName} API started without database access. Start local MongoDB or update MONGODB_URI for auth, portfolio, trading, watchlists, and settings.`);
        return null;
      }

      console.warn(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      await delay(attempt * 2000);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.connection.close();
};

module.exports = { connectDB, disconnectDB };
