import mysql from 'mysql2/promise';
import './config.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // La base guarda las fechas en UTC; el frontend las convierte a hora local.
  timezone: 'Z',
});

export default pool;
