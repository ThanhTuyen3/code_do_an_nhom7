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
    user: 'postgres.droxvmimrvgzrxbkdnrj',
    password: 'Tnguyen@33279',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log('Đã kết nối thành công tới Supabase!'))
    .catch(err => console.error('Lỗi kết nối CSDL:', err));

// ===== ĐĂNG NHẬP =====
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = 'SELECT * FROM Users WHERE email = $1';
        const result = await client.query(query, [email]);
        
        if (result.rows.length === 0) {
            console.log("Không tìm thấy email:", email);
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
        }
        const user = result.rows[0];
        console.log("Mật khẩu nhập vào:", password);
        console.log("Mật khẩu trong DB:", user.password_hash);
        if (password.trim() === user.password_hash.trim()) {
            res.status(200).json({ success: true, message: "Đăng nhập thành công!" });
        } else {
            res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
        }
    } catch (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi truy vấn CSDL." });
    }
});

// ===== LẤY DANH SÁCH CUỘC HỌP =====
app.get('/get-meetings', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM Meetings ORDER BY meeting_date');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi truy vấn CSDL' });
    }
});

// ===== TẠO CUỘC HỌP MỚI =====
app.post('/create-meeting', async (req, res) => {
    const { title, description, meeting_date, location, organizer_id } = req.body;
    try {
        const query = `
            INSERT INTO Meetings (title, description, meeting_date, location, organizer_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`;
        const values = [title, description, meeting_date, location, organizer_id];
        const result = await client.query(query, values);
        res.status(200).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể tạo cuộc họp. ' + err.message });
    }
});

// ===== ĐỔI MẬT KHẨU =====
app.post('/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
        // Đã bỏ dấu ngoặc kép quanh Users
        const check = await client.query(
            'SELECT * FROM Users WHERE email=$1 AND password_hash=$2',
            [email, currentPassword]
        );
        if (check.rows.length === 0) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }
        await client.query('UPDATE Users SET password_hash=$1 WHERE email=$2', [newPassword, email]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu. ' + err.message });
    }
});

app.listen(3000, () => console.log('Server chạy tại http://localhost:3000/cuochop.html '));