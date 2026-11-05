-- Create test database if not exists
SELECT 'CREATE DATABASE campusbites_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'campusbites_test')\gexec
