-- Hapus semua data lama agar tidak bentrok dengan aturan NOT NULL
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Baru tambahkan kolomnya
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL;
