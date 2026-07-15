const { Pool } = require('pg');

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('Đã kết nối thành công với Supabase!'))
  .catch(err => console.error('Lỗi kết nối:', err.stack));

module.exports = pool;