const oracledb = require('oracledb');
require('dotenv').config();

// Use Thin mode (no Oracle Client needed)
// oracledb.initOracleClient(); // Only needed for Thick mode

let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('✅ Oracle Database connection pool created successfully');
  } catch (err) {
    console.error('❌ Oracle Database connection failed:', err.message);
    console.log('⚠️  Running in fallback mode with in-memory data');
  }
}

async function getConnection() {
  if (!pool) {
    return null;
  }
  return await pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(0);
    console.log('Database pool closed');
  }
}

module.exports = { initialize, getConnection, closePool };
