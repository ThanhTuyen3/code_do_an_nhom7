const express = require('express');
const path = require('path');
const { Client } = require('pg');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: '5432',
    database: 'postgres',
    user: 'postgres.hniatsxkwpvoprehidky',
    password: 'TNguyen@22371',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log('Đã kết nối thành công tới Supabase!'))
    .catch(err => console.error('Lỗi kết nối CSDL:', err));

// ===== ĐĂNG NHẬP =====
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = 'SELECT * FROM "users" WHERE email = $1 AND password_hash = $2';
        const result = await client.query(query, [email, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: "Đăng nhập thành công!" });
        } else {
            res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi truy vấn CSDL." });
    }
});

// ===== SỬA 2: ĐỔI TÊN /api/meetings THÀNH /get-meetings ĐỂ KHỚP VỚI FRONTEND =====
app.get('/get-meetings', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM "meetings" ORDER BY date, "startHour"');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi truy vấn CSDL' });
    }
});

// ===== TẠO CUỘC HỌP MỚI =====
app.post('/create-meeting', async (req, res) => {
    const { title, date, startHour, duration, room, desc, color, organizerEmail, participants } = req.body;
    try {
        const query = `
            INSERT INTO "meetings"
                (title, date, "startHour", duration, room, desc, color, "organizerEmail", status, participants)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Sắp tới',$9)
            RETURNING *`;
        const values = [title, date, startHour, duration, room, desc, color, organizerEmail, JSON.stringify(participants)];
        const result = await client.query(query, values);
        res.status(200).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể tạo cuộc họp. ' + err.message });
    }
});

// ===== CẬP NHẬT / SỬA CUỘC HỌP =====
app.post('/update-meeting', async (req, res) => {
    const { id, title, date, startHour, duration, room, desc, color, participants } = req.body;
    try {
        const query = `
            UPDATE "meetings"
            SET title=$1, date=$2, "startHour"=$3, duration=$4, room=$5, desc=$6, color=$7, participants=$8
            WHERE id=$9
            RETURNING *`;
        const values = [title, date, startHour, duration, room, desc, color, JSON.stringify(participants), id];
        const result = await client.query(query, values);
        res.status(200).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể cập nhật cuộc họp. ' + err.message });
    }
});

// ===== NGƯỜI ĐƯỢC MỜI TỪ CHỐI THAM GIA =====
app.post('/reject-meeting', async (req, res) => {
    const { id, reason, email } = req.body;
    try {
        await client.query(
            'UPDATE "meetings" SET status=$1, "rejectReason"=$2, "rejectedBy"=$3 WHERE id=$4',
            ['Đã Hủy', reason, email, id]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể từ chối cuộc họp. ' + err.message });
    }
});

// ===== NGƯỜI TỔ CHỨC HỦY CUỘC HỌP =====
app.post('/cancel-meeting', async (req, res) => {
    const { id, reason } = req.body;
    try {
        await client.query(
            'UPDATE "meetings" SET status=$1, "cancelReason"=$2 WHERE id=$3',
            ['Đã Hủy', reason, id]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể hủy cuộc họp. ' + err.message });
    }
});

// ===== ĐỒNG Ý THAM GIA / ĐỔI TRẠNG THÁI =====
app.post('/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        await client.query('UPDATE "meetings" SET status=$1 WHERE id=$2', [status, id]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái. ' + err.message });
    }
});

// ===== ĐỔI MẬT KHẨU =====
app.post('/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        const check = await client.query(
            'SELECT * FROM "users" WHERE email=$1 AND password_hash=$2',
            [email, currentPassword]
        );
        if (check.rows.length === 0) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }
        await client.query('UPDATE "users" SET password_hash=$1 WHERE email=$2', [newPassword, email]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu. ' + err.message });
    }
});

app.listen(3000, () => console.log('Server chạy tại http://localhost:3000/cuochop.html '));