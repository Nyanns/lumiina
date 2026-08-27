# Lumiina MVP Scope V2 — Fast-Track Edition
*Revisi dari LUMIINA_MVP_SCOPE.md, disesuaikan dengan kesepakatan Fast-Track 20 Hari (26 Aug 2026)*

---

## 1. Tujuan Utama (Tidak Berubah)
Membangun aplikasi Fullstack nyata yang fungsional sebagai:
1. **Portofolio Backend Developer** (Go + Clean Architecture + PostgreSQL)
2. **"Tikus Percobaan" untuk Portofolio QA Automation Engineer** (E2E + API Testing)

Target: **Pertengahan September 2026 — Mulai Apply Kerja (Backend + QA)**

---

## 2. Core Features (MVP V2 — Dipangkas untuk Kecepatan)

### Sandi Tulis Sendiri (Inti Skill)
- [x] User Registration (Bcrypt hashing)
- [ ] User Login (JWT Token generation)
- [ ] Auth Middleware (Validasi Token di setiap request)
- [ ] RBAC Middleware (Validasi Role: admin vs regular)
- [ ] CRUD Artwork + Upload via Cloudinary
- [ ] Unit Testing + Mocking (5-8 test case kritis)

### AI Kerjakan, Sandi Baca & Pahami
- [ ] Like, Bookmark, Follow system (Many-to-Many relations)
- [ ] Redis Caching (Trending artworks)
- [ ] Browse & Search artwork (by tag, by artist)
- [ ] Artist profile page (daftar karya)
- [ ] Pagination (sudah ada dari Sesi 7)

---

## 3. Sistem Admin (Tidak Berubah dari V1)
- **Backend:** RBAC Middleware + API Admin (hapus karya, dll) — **TETAP DIBUAT**
- **Dashboard UI Admin:** **DITIADAKAN** dari Frontend
- **Promosi Admin:** Via SQL langsung (`UPDATE users SET role = 'admin' WHERE username = 'xxx';`)

---

## 4. Teknologi & Standar Industri

| Layer | Teknologi |
|-------|-----------|
| Backend | Go (Golang), Gin Framework, GORM + PostgreSQL |
| Arsitektur | Clean Architecture (Handler → Service → Repository) |
| Keamanan | JWT + Bcrypt |
| Performa | Redis (Caching) |
| Database Migration | golang-migrate (up/down) |
| Containerization | Docker & Docker Compose |
| API Docs | Swagger UI (swaggo/swag) |
| Testing | Unit Test + Mocking (testify) |
| CI/CD | GitHub Actions |
| Frontend | Vite + React + TailwindCSS (Light Theme, Anti AI-Slop) |
| Deployment | Supabase (DB) + Render (API) + Vercel (Frontend) |

---

## 5. Pembagian Kerja & Gaya Mengajar

### Mode Belajar: Speed Mode ⚡
- Analogi HANYA untuk konsep baru yang krusial
- Langsung kode + penjelasan singkat
- Copy-paste dibolehkan untuk konfigurasi (Docker, CI/CD, Swagger)
- Tulis sendiri HANYA untuk logika inti (Auth, Testing, QA)

### Prinsip
> Selama Sandi **paham konsepnya** dan bisa **menjelaskan ulang saat interview**, cara belajarnya (tulis sendiri vs baca kode AI) tidak masalah.

---

## 6. Backlog V2 (Tidak Dikerjakan di MVP)
- WebSocket (Real-time notifications)
- RabbitMQ (Message Queue)
- gRPC (Inter-service communication)
- Art Challenge (Leaderboard Mingguan)
- Remix Tree (Node graph karya turunan)
- Dashboard UI Admin
- Komisi System
- Ephemeral Exhibition
- Color Palette Extraction

---

## 7. QA Portfolio Plan (Setelah MVP Backend Selesai)

### Repo Terpisah: `lumiina-qa-automation`
Berpedoman penuh pada standar global [roadmap.sh/qa](https://roadmap.sh/qa)

| Fase | Materi | Durasi |
|------|--------|--------|
| QA Fase 1 | Teori: SDLC, STLC, jenis testing, test case writing | 2 hari |
| QA Fase 2 | Tools: Jira (project management, bug report, workflow) | 2 hari |
| QA Fase 3 | API Testing: Postman Collection + Newman CLI | 2 hari |
| QA Fase 4 | E2E Automation: Playwright (3-5 test scenario kritis) | 2 hari |
| Polish | README, GitHub profile, CV | 1 hari |

### Output QA Portfolio
- Test Cases document (manual testing)
- Bug Reports di Jira (screenshot workflow)
- API Testing Collection (Postman + Newman + CI integration)
- E2E Test Scripts (Playwright, repo tersendiri)
- CI/CD pipeline untuk automation test (GitHub Actions)

---

## 8. Strategi Melamar Kerja

### Dual Apply (Backend + QA Sekaligus)
Tidak menunggu Backend gagal baru apply QA. Langsung apply keduanya dari hari pertama.

### CV Highlights
- S1 Informatika
- HTB Level 10 (Cybersecurity)
- Go Backend Developer (langka di Indonesia)
- QA Engineer dengan pemahaman Backend mendalam
- Portofolio nyata dengan live URL

### Kalimat Sakti Interview
> "Saya paham cara ngetes API karena saya bisa bikin API skala industri pakai Go."
