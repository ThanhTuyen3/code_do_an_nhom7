-- 1. CẤU TRÚC BẢNG (Tables) cho PostgreSQL
-- Bảng Users: Chứa danh sách nhân viên
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Meetings: Lưu cuộc họp
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

-- Bảng Attendees: Danh sách tham dự
CREATE TABLE Attendees (
    meeting_id INT,
    user_id INT,
    status VARCHAR(20) DEFAULT 'pending',
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES Meetings(meeting_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Bảng MeetingMinutes: Biên bản cuộc họp
CREATE TABLE MeetingMinutes (
    minute_id SERIAL PRIMARY KEY,
    meeting_id INT UNIQUE,
    content TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES Meetings(meeting_id) ON DELETE CASCADE
);

-- 2. DỮ LIỆU NHÂN VIÊN 
INSERT INTO Users (full_name, email, password_hash, role)
VALUES
('Tran Van B', 'tranvanb@congty.com', '123', 'employee'),
('Le Thi C', 'lethic@congty.com', '123', 'employee'),
('Pham Van D', 'phamvand@congty.com', '123', 'employee');