package handler

func renderVerificationSuccessPage() string {
	return `<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Aktivasi Akun Berhasil | Lumiina</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
		body { background-color: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
		.navbar { height: 64px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 32px; }
		.brand { font-size: 18px; font-weight: 700; color: #0284c7; text-decoration: none; display: flex; align-items: center; gap: 8px; }
		.brand span { font-size: 12px; font-weight: 500; color: #64748b; margin-left: 6px; }
		.main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
		.container { background: #ffffff; max-width: 520px; width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px; }
		.status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #059669; margin-bottom: 16px; }
		.status-dot { width: 8px; height: 8px; background: #059669; border-radius: 50%; }
		h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
		p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
		.feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 28px; font-size: 13px; color: #334155; line-height: 1.5; }
		.feature-box ul { list-style: none; margin: 0; padding: 0; }
		.feature-box li { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
		.feature-box li:last-child { margin-bottom: 0; }
		.feature-box li::before { content: "✓"; color: #0284c7; font-weight: 700; }
		.btn-primary { display: block; width: 100%; padding: 12px 20px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; transition: background 0.15s; }
		.btn-primary:hover { background: #0369a1; }
		.footer { height: 60px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
	</style>
</head>
<body>
	<nav class="navbar">
		<a href="http://localhost:5173" class="brand">Lumiina <span>Fan Art Community</span></a>
	</nav>
	
	<main class="main">
		<div class="container">
			<div class="status-badge">
				<div class="status-dot"></div> Email Terverifikasi
			</div>
			<h1>Akun Anda Telah Aktif</h1>
			<p>Selamat datang di komunitas seni anime Lumiina. Alamat email Anda telah berhasil divalidasi dan akun Anda kini siap digunakan sepenuhnya.</p>
			
			<div class="feature-box">
				<ul>
					<li>Bagikan ilustrasi dan fan art anime karya Anda</li>
					<li>Beri bookmark dan komentar pada karya favorit</li>
					<li>Ikuti artist berbakat dari seluruh komunitas</li>
				</ul>
			</div>

			<a href="http://localhost:5173/login" class="btn-primary">Masuk ke Akun</a>
		</div>
	</main>

	<footer class="footer">
		&copy; 2026 Lumiina Inc. Hak cipta dilindungi.
	</footer>
</body>
</html>`
}

func renderVerificationErrorPage(title, message string) string {
	return `<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>` + title + ` | Lumiina</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
		body { background-color: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
		.navbar { height: 64px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 32px; }
		.brand { font-size: 18px; font-weight: 700; color: #0284c7; text-decoration: none; display: flex; align-items: center; gap: 8px; }
		.brand span { font-size: 12px; font-weight: 500; color: #64748b; margin-left: 6px; }
		.main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
		.container { background: #ffffff; max-width: 520px; width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px; }
		.status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 16px; }
		.status-dot { width: 8px; height: 8px; background: #dc2626; border-radius: 50%; }
		h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
		p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
		.troubleshoot-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 28px; }
		.troubleshoot-title { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
		.troubleshoot-box ul { font-size: 13px; color: #64748b; line-height: 1.5; padding-left: 18px; margin: 0; }
		.troubleshoot-box li { margin-bottom: 6px; }
		.troubleshoot-box li:last-child { margin-bottom: 0; }
		.btn-primary { display: block; width: 100%; padding: 12px 20px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; transition: background 0.15s; }
		.btn-primary:hover { background: #0369a1; }
		.footer { height: 60px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
	</style>
</head>
<body>
	<nav class="navbar">
		<a href="http://localhost:5173" class="brand">Lumiina <span>Fan Art Community</span></a>
	</nav>
	
	<main class="main">
		<div class="container">
			<div class="status-badge">
				<div class="status-dot"></div> Tautan Kedaluwarsa
			</div>
			<h1>Tautan Aktivasi Tidak Dapat Digunakan</h1>
			<p>` + message + `</p>
			
			<div class="troubleshoot-box">
				<div class="troubleshoot-title">Kemungkinan penyebab:</div>
				<ul>
					<li>Akun Anda sudah berhasil diverifikasi pada klik sebelumnya.</li>
					<li>Masa berlaku tautan (24 jam) telah berakhir.</li>
					<li>Tautan telah kedaluwarsa karena permintaan verifikasi baru.</li>
				</ul>
			</div>

			<a href="http://localhost:5173/login" class="btn-primary">Coba Masuk</a>
		</div>
	</main>

	<footer class="footer">
		&copy; 2026 Lumiina Inc. Hak cipta dilindungi.
	</footer>
</body>
</html>`
}
