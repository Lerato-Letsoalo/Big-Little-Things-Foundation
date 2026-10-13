
-- ==================== USERS ====================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100),
  role ENUM('admin','volunteer') NOT NULL DEFAULT 'volunteer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- ==================== TEAM MEMBERS ====================
CREATE TABLE team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT NOT NULL,
  image_path VARCHAR(500),
  image_alt VARCHAR(500),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==================== EVENTS / DRIVES ====================
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status ENUM('upcoming','active','completed','archived') DEFAULT 'upcoming',
  event_date DATE NULL,
  image_path VARCHAR(500),
  published TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_published (published)
) ENGINE=InnoDB;

-- ==================== VOLUNTEER SESSIONS ====================
CREATE TABLE volunteer_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NULL,
  title VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==================== SESSION ATTENDANCE ====================
CREATE TABLE session_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  FOREIGN KEY (session_id) REFERENCES volunteer_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (session_id, user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==================== CERTIFICATES ====================
CREATE TABLE certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attendance_id INT NOT NULL UNIQUE,
  certificate_code VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (attendance_id) REFERENCES session_attendance(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== DONATIONS ====================
CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(50),
  city VARCHAR(100),
  donation_type ENUM('money','food','clothing','sanitary') NOT NULL,
  amount DECIMAL(10,2) NULL,
  quantity_description VARCHAR(500) NULL,
  message TEXT,
  anonymous TINYINT(1) DEFAULT 0,
  proof_path VARCHAR(500),
  item_image_path VARCHAR(500),
  status ENUM('pending_verification','verified','rejected','received','collection_arranged','completed') DEFAULT 'pending_verification',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (donation_type),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==================== GALLERY ====================
CREATE TABLE gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  caption TEXT,
  alt_text VARCHAR(500),
  image_path VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==================== TESTIMONIALS ====================
CREATE TABLE testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  event_label VARCHAR(255),
  content TEXT NOT NULL,
  status ENUM('draft','approved','published','rejected') DEFAULT 'draft',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==================== CONTACT ENQUIRIES ====================
CREATE TABLE contact_enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status ENUM('pending','in_progress','resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;