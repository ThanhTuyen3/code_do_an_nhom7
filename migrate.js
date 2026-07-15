const { Client } = require('pg');
const c = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: '5432',
    database: 'postgres',
    user: 'postgres.droxvmimrvgzrxbkdnrj',
    password: 'Tnguyen@33279',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    await c.connect();
    console.log('Đã kết nối CSDL...');

    const sql = `
        ALTER TABLE meetings
            ADD COLUMN IF NOT EXISTS start_hour NUMERIC DEFAULT 8,
            ADD COLUMN IF NOT EXISTS duration NUMERIC DEFAULT 1,
            ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'event-blue',
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Sap toi',
            ADD COLUMN IF NOT EXISTS organizer_email VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT ''
    `;
    await c.query(sql);
    console.log('✅ Đã thêm các cột còn thiếu vào bảng meetings!');

    // Kiểm tra lại
    const check = await c.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='meetings' ORDER BY ordinal_position"
    );
    console.log('\nCấu trúc bảng meetings hiện tại:');
    check.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    await c.end();
}

migrate().catch(e => {
    console.error('Lỗi migration:', e.message);
    c.end();
});
