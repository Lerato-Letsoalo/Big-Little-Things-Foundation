-- Event capacity and volunteer registration migration.
-- Select the application's database before running this file. Each event
-- column is added only when it is absent, so this can safely follow schema.sql.

SET @schema_name = DATABASE();
SET @has_capacity = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'events' AND COLUMN_NAME = 'capacity'
);
SET @ddl = IF(@has_capacity = 0,
  'ALTER TABLE events ADD COLUMN capacity INT NULL AFTER event_date',
  'SELECT 1');
PREPARE event_capacity_stmt FROM @ddl;
EXECUTE event_capacity_stmt;
DEALLOCATE PREPARE event_capacity_stmt;

SET @has_registration_open = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'events' AND COLUMN_NAME = 'registration_open'
);
SET @ddl = IF(@has_registration_open = 0,
  'ALTER TABLE events ADD COLUMN registration_open TINYINT(1) NOT NULL DEFAULT 1 AFTER capacity',
  'SELECT 1');
PREPARE event_registration_open_stmt FROM @ddl;
EXECUTE event_registration_open_stmt;
DEALLOCATE PREPARE event_registration_open_stmt;

CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered','cancelled','attended') NOT NULL DEFAULT 'registered',
  cancelled_at TIMESTAMP NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (event_id, user_id),
  INDEX idx_event_status (event_id, status),
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB;
