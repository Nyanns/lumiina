# Lumiina V1 (MVP) Scope & Roadmap
*Dokumen ini berfokus pada strategi "Pragmatic Play" untuk pembuatan Portofolio QA Automation Engineer secara efisien dan terarah.*

## 1. Tujuan Utama
Fokus utama dari V1 (MVP) ini adalah membangun aplikasi Fullstack nyata yang fungsional untuk dijadikan "tikus percobaan" atau landasan bagi **QA Automation Testing (E2E Web E2E & API Testing)**. Alih-alih mengejar arsitektur *microservices* yang kompleks (yang tidak akan di- *test* oleh QA UI/API di awal karir), kita berfokus pada alur bisnis yang solid.

## 2. 1.1 Core Features (Scope V1 / MVP)
Fitur-fitur standar berikut adalah **Harga Mati (Wajib Selesai)** untuk V1:
- [ ] **User registration & authentication** (Artist / Viewer + Token JWT + Bcrypt)
- [ ] **Upload artwork** dengan metadata (title, description, tags) via Cloudinary
- [ ] **Browse & search artwork** (by tag, by artist, trending)
- [ ] **Like, bookmark, dan follow system**
- [ ] **Artist profile page** dengan portfolio (Daftar karya)
- [ ] **Pagination & infinite scroll** (Limit & Offset di GORM)

## 3. Sistem Admin (Role-Based Access Control)
- **Backend API (V1):** Middleware RBAC (Validasi Role) dan API khusus Admin (seperti: hapus karya melanggar) **TETAP DIBUAT**. Ini penting karena skenario menguji API dengan beda *role* adalah materi wajib portofolio QA.
- **Dashboard UI Admin:** **DITIADAKAN** dari Frontend V1 untuk menghemat waktu.
- **Mekanisme Promosi Admin:** Berbasis *hacker-way* via manipulasi SQL langsung (`UPDATE users SET role = 'admin' WHERE username = 'nama_user';`).

## 4. Teknologi & Standar Industri (Dipertahankan di V1)
Meskipun fiturnya dipangkas jadi MVP, standar *engineering*-nya tidak diturunkan:
- **Backend:** Go (Golang), Gin Framework, GORM + PostgreSQL
- **Arsitektur:** Clean Architecture (Handler, Service, Repository)
- **Keamanan:** JWT (JSON Web Token) & Bcrypt (Password Hashing)
- **Performa:** Redis (Caching)
- **QA Ops:** Docker & Docker Compose, Swagger UI (API Docs), Unit Testing (Mocking), GitHub Actions (CI/CD)
- **Frontend:** Vite + React + TailwindCSS (Tema Light / Terang ala Pixiv, Anti AI-Slop)

## 5. 1.2 Unique Features (Pindah ke Backlog V2)
Fitur asinkron dan kompleks berikut ini sangat bagus, namun akan memperlambat penyelesaian Portofolio QA. Resmi dipindahkan ke V2:
- WebSocket (Real-time notifications)
- RabbitMQ (Message Queue)
- gRPC (Inter-service communication)
- Art Challenge (Leaderboard Mingguan)
- Remix Tree (Node graph karya turunan)
- Dashboard UI Khusus Admin
