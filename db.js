const { Pool } = require('pg');

// Sử dụng Pool thay vì Client
const pool = new Pool({
  host: 'hniatsxkwpvoprehidky.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'TNguyen@22371',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Kết nối thông qua Pool
pool.connect()
  .then(() => console.log('Đã kết nối thành công với Supabase!'))
  .catch(err => console.error('Lỗi kết nối:', err.stack));

module.exports = pool;