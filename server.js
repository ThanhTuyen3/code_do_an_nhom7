const express = require('express');
const path = require('path');
const { Client } = require('pg');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: 'postgres://postgres.droxvmimrvgzrxbkdnrj:Tnguyen@33279@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

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
        const result = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
        }
        const user = result.rows[0];
        if (password.trim() === user.password_hash.trim()) {
            res.status(200).json({ success: true, message: "Đăng nhập thành công!", user_id: user.id });
        } else {
            res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
        }
    } catch (err) {
        console.error("Lỗi truy vấn:", err);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi truy vấn CSDL." });
    }
});

// ===== LẤY DANH SÁCH CUỘC HỌP =====
// Trả về dữ liệu theo đúng cấu trúc mà frontend cần:
// { id, title, date, startHour, duration, room, desc, color, status,
//   organizerEmail, organizerIsMe (boolean), participants: [{name, status}] }
app.get('/get-meetings', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM Meetings ORDER BY meeting_date');
        // Map lại tên cột từ CSDL sang tên field mà frontend dùng
        const meetings = result.rows.map(row => ({
            id:             row.meeting_id,
            title:          row.title,
            date:           row.meeting_date ? (typeof row.meeting_date === 'string' ? row.meeting_date.split('T')[0] : row.meeting_date.toISOString().split('T')[0]) : '',
            startHour:      parseFloat(row.start_hour) || 8,
            duration:       parseFloat(row.duration)   || 1,
            room:           row.location || row.room   || 'Phòng A',
            desc:           row.description || row.desc || '',
            color:          row.color       || 'event-blue',
            status:         row.status      || 'Sắp tới',
            organizer:      row.organizer_email || '',
            organizerEmail: row.organizer_email || '',
            organizerIsMe:  false, // sẽ tính ở phía client (so email)
            cancelReason:   row.cancel_reason || '',
            participants:   row.participants  || []
        }));
        res.json(meetings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi truy vấn CSDL' });
    }
});

// ===== TẠO CUỘC HỌP MỚI =====
// Frontend gửi: { title, date, startHour, duration, room, desc, color, organizerEmail, participants: [name,...] }
app.post('/create-meeting', async (req, res) => {
    const { title, date, startHour, duration, room, desc, color, organizerEmail, participants } = req.body;
    try {
        const query = `
            INSERT INTO Meetings
                (title, description, meeting_date, start_hour, duration, location, color, status, organizer_email, participants)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`;
        const participantsJson = JSON.stringify(
            (participants || []).map(name => ({ name, status: 'Chờ xác nhận' }))
        );
        const values = [
            title,
            desc || '',
            date,
            startHour,
            duration,
            room,
            color || 'event-blue',
            'Sắp tới',
            organizerEmail || '',
            participantsJson
        ];
        const result = await client.query(query, values);
        res.status(200).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể tạo cuộc họp. ' + err.message });
    }
});

// ===== CẬP NHẬT CUỘC HỌP =====
app.post('/update-meeting', async (req, res) => {
    const { id, title, date, startHour, duration, room, desc, color, participants } = req.body;
    try {
        const participantsJson = JSON.stringify(
            (participants || []).map(name => ({ name, status: 'Chờ xác nhận' }))
        );
        const query = `
            UPDATE Meetings
            SET title=$1, description=$2, meeting_date=$3, start_hour=$4, duration=$5,
                location=$6, color=$7, participants=$8
            WHERE meeting_id=$9
            RETURNING *`;
        const values = [title, desc || '', date, startHour, duration, room, color || 'event-blue', participantsJson, id];
        const result = await client.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc họp.' });
        }
        res.status(200).json({ success: true, meeting: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể cập nhật cuộc họp. ' + err.message });
    }
});

// ===== CẬP NHẬT TRẠNG THÁI CUỘC HỌP (xác nhận tham gia) =====
app.post('/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        const result = await client.query(
            'UPDATE Meetings SET status=$1 WHERE meeting_id=$2 RETURNING *',
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc họp.' });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái. ' + err.message });
    }
});

// ===== HỦY CUỘC HỌP =====
app.post('/cancel-meeting', async (req, res) => {
    const { id, reason } = req.body;
    try {
        const result = await client.query(
            "UPDATE Meetings SET status='Đã Hủy', cancel_reason=$1 WHERE meeting_id=$2 RETURNING *",
            [reason || '', id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc họp.' });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể hủy cuộc họp. ' + err.message });
    }
});

// ===== TỪ CHỐI CUỘC HỌP =====
app.post('/reject-meeting', async (req, res) => {
    const { id, reason } = req.body;
    try {
        const result = await client.query(
            "UPDATE Meetings SET status='Đã Hủy', cancel_reason=$1 WHERE meeting_id=$2 RETURNING *",
            [reason || '', id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy cuộc họp.' });
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Không thể từ chối cuộc họp. ' + err.message });
    }
});

// ===== ĐỔI MẬT KHẨU =====
app.post('/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    try {
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

app.listen(3000, () => console.log('Server chạy tại http://localhost:3000/cuochop.html'));