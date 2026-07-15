-- Xóa bảng cũ để làm sạch (nếu cần)
DROP TABLE IF EXISTS MeetingMinutes CASCADE;
DROP TABLE IF EXISTS Attendees CASCADE;
DROP TABLE IF EXISTS Meetings CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Tạo bảng Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng Meetings
CREATE TABLE Meetings (
    meeting_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP NOT NULL,
    location VARCHAR(200),
    organizer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES Users(user_id)
);

-- Tạo bảng Attendees
CREATE TABLE Attendees (
    meeting_id INT,
    user_id INT,
    status VARCHAR(20) DEFAULT 'pending',
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES Meetings(meeting_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Tạo bảng MeetingMinutes
CREATE TABLE MeetingMinutes (
    minute_id SERIAL PRIMARY KEY,
    meeting_id INT UNIQUE,
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES Meetings(meeting_id) ON DELETE CASCADE
);

-- Thêm dữ liệu nhân viên
INSERT INTO Users (full_name, email, password_hash, role)
VALUES
('Trần Thị Bích', 'tranthibich@congty.com', '123', 'employee'),
('Lê Văn Cường', 'levancuong@congty.com', '123', 'employee'),
('Phạm Thùy Dung', 'phamthuydung@congty.com', '123', 'employee'),
('Hoàng Minh Em', 'hongminhem@congty.com', '123', 'employee'),
('Vũ Quốc Huy', 'vuquochuy@congty.com', '123', 'employee'),
('Ngô Thanh Lan', 'ngothanhlan@congty.com', '123', 'employee'),
('Đỗ Hải Nam', 'dohainam@congty.com', '123', 'employee'),
('Bùi Kim Oanh', 'buikimoanh@congty.com', '123', 'employee');