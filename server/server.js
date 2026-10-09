const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables: prefer server/.env, otherwise use the repo root .env
const localEnv = path.join(__dirname, '.env');
const rootEnv = path.join(__dirname, '..', '.env');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`BazaarHub API running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start the server:');
    console.error(err.message);
    process.exit(1);
  }
}

// Friendly error for a MongoDB that is not reachable
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message || err);
});

start();
