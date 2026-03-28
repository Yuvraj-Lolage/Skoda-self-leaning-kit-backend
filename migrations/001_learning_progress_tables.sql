-- Three-table progress model (no events table). Run once against your MySQL database.
-- Default track_id = 1 when you have a single course; add tracks later if needed.

CREATE TABLE IF NOT EXISTS user_learning_path_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  track_id INT NOT NULL DEFAULT 1,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  current_module_id INT NULL,
  next_module_id INT NULL,
  completed_modules_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_modules_count INT UNSIGNED NOT NULL DEFAULT 0,
  completion_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_accessed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_track (user_id, track_id),
  KEY idx_user_last_accessed (user_id, last_accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_module_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  track_id INT NOT NULL DEFAULT 1,
  module_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  completion_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  current_submodule_id INT NULL,
  next_submodule_id INT NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_accessed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_module (user_id, module_id),
  KEY idx_user_track_status (user_id, track_id, status),
  KEY idx_user_last_accessed (user_id, last_accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_submodule_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  track_id INT NOT NULL DEFAULT 1,
  module_id INT NOT NULL,
  submodule_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  completion_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_accessed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_submodule (user_id, submodule_id),
  KEY idx_user_module_status (user_id, module_id, status),
  KEY idx_user_track_status (user_id, track_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
