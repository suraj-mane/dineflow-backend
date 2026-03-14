-- Migration: 003_add_logo_url

ALTER TABLE restaurants
ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL;

INSERT IGNORE INTO schema_migrations (version) VALUES ('003_add_logo_url');