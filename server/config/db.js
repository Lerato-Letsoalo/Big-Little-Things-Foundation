const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caCert = fs.readFileSync(
  path.resolve(__dirname, '..', '..', process.env.DB_SSL_CA || './certs/ca.pem'),
  'utf-8'
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: { ca: caCert, rejectUnauthorized: true }
});

module.exports = pool;