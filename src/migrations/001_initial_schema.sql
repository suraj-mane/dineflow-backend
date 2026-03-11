-- DineFlow Initial Schema
-- Migration: 001_initial_schema

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100)  NOT NULL,
  last_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','owner','kitchen','cashier','customer') NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS restaurants (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id     INT UNSIGNED NOT NULL,
  name         VARCHAR(255) NOT NULL,
  descriptions TEXT,
  phone        VARCHAR(20),
  status       ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS restaurant_locations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL UNIQUE,
  address       VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(100),
  postal_code   VARCHAR(20),
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id    INT UNSIGNED NOT NULL UNIQUE,
  is_open          BOOLEAN NOT NULL DEFAULT TRUE,
  accepting_orders BOOLEAN NOT NULL DEFAULT TRUE,
  currency         VARCHAR(10) NOT NULL DEFAULT 'INR',
  tax_percentage   DECIMAL(5,2) DEFAULT 0.00,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restaurant_stats (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL UNIQUE,
  rating        DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_orders  INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_restaurant (restaurant_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT UNSIGNED NOT NULL,
  category_id   INT UNSIGNED NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  image_url     VARCHAR(500),
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id)   REFERENCES categories(id)  ON DELETE CASCADE,
  INDEX idx_restaurant (restaurant_id),
  INDEX idx_category   (category_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  restaurant_id  INT UNSIGNED NOT NULL,
  customer_id    INT UNSIGNED NOT NULL,
  status         ENUM('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  total_amount   DECIMAL(10,2) NOT NULL,
  timeout_job_id VARCHAR(255),
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id)   REFERENCES users(id)       ON DELETE CASCADE,
  INDEX idx_restaurant (restaurant_id),
  INDEX idx_customer   (customer_id),
  INDEX idx_status     (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  INDEX idx_order (order_id)
);

-- CREATE TABLE IF NOT EXISTS schema_migrations (
--   version    VARCHAR(255) PRIMARY KEY,
--   applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT IGNORE INTO schema_migrations (version) VALUES ('001_initial_schema');