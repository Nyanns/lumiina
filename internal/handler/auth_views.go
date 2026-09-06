package handler

import (
	"encoding/json"
	"strings"
)

func renderVerificationSuccessPage(tokenString string, userJSON string) string {
	tmpl := `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Account Activated | Lumiina</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
		body { background-color: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
		.navbar { height: 64px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 32px; }
		.brand { font-size: 18px; font-weight: 700; color: #0096fa; text-decoration: none; display: flex; align-items: center; gap: 8px; }
		.brand span { font-size: 12px; font-weight: 500; color: #64748b; margin-left: 6px; }
		.main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
		.container { background: #ffffff; max-width: 520px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 40px; text-align: center; }
		.status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #059669; margin-bottom: 16px; }
		.status-dot { width: 8px; height: 8px; background: #059669; border-radius: 50%; }
		h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
		p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
		.redirect-notice { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13px; color: #0284c7; font-weight: 500; margin-bottom: 24px; }
		.spinner { width: 16px; height: 16px; border: 2px solid #bae6fd; border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite; }
		@keyframes spin { to { transform: rotate(360deg); } }
		.btn-primary { display: block; width: 100%; padding: 12px 20px; background: #0096fa; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; text-align: center; transition: background 0.15s; }
		.btn-primary:hover { background: #0084e0; }
		.footer { height: 60px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
	</style>
</head>
<body>
	<nav class="navbar">
		<a href="/" class="brand">Lumiina <span>Illustration & Creator Community</span></a>
	</nav>
	
	<main class="main">
		<div class="container">
			<div class="status-badge">
				<div class="status-dot"></div> Email Terverifikasi
			</div>
			<h1>Akun Anda Telah Aktif!</h1>
			<p>Selamat datang di komunitas ilustrasi Lumiina! Email Anda berhasil diverifikasi dan akun Anda telah aktif.</p>
			
			<div class="redirect-notice" id="redirect-notice">
				<div class="spinner"></div> Sedang masuk otomatis ke Lumiina...
			</div>

			<a href="/" id="action-btn" class="btn-primary">Masuk ke Lumiina Sekarang</a>
		</div>
	</main>

	<footer class="footer">
		&copy; 2026 Lumiina Inc. All rights reserved.
	</footer>

	<script>
		(function() {
			try {
				var token = {{TOKEN_JSON}};
				var user = {{USER_JSON}};
				if (token) {
					localStorage.setItem('lumiina_token', token);
					if (user) {
						localStorage.setItem('lumiina_user', JSON.stringify(user));
					}
					setTimeout(function() {
						window.location.href = '/';
					}, 1200);
				} else {
					var notice = document.getElementById('redirect-notice');
					if (notice) notice.style.display = 'none';
					var btn = document.getElementById('action-btn');
					if (btn) {
						btn.href = '/login';
						btn.innerText = 'Login ke Akun Anda';
					}
				}
			} catch (e) {
				console.error('Auto login error:', e);
			}
		})();
	</script>
</body>
</html>`

	tokenJSON, _ := json.Marshal(tokenString)
	if userJSON == "" {
		userJSON = "null"
	}

	res := strings.ReplaceAll(tmpl, "{{TOKEN_JSON}}", string(tokenJSON))
	res = strings.ReplaceAll(res, "{{USER_JSON}}", userJSON)
	return res
}

func renderVerificationErrorPage(title, message string) string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>` + title + ` | Lumiina</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
		body { background-color: #f8fafc; color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; }
		.navbar { height: 64px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 32px; }
		.brand { font-size: 18px; font-weight: 700; color: #0096fa; text-decoration: none; display: flex; align-items: center; gap: 8px; }
		.brand span { font-size: 12px; font-weight: 500; color: #64748b; margin-left: 6px; }
		.main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
		.container { background: #ffffff; max-width: 520px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; padding: 40px; }
		.status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 16px; }
		.status-dot { width: 8px; height: 8px; background: #dc2626; border-radius: 50%; }
		h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
		p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
		.troubleshoot-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 28px; }
		.troubleshoot-title { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
		.troubleshoot-box ul { font-size: 13px; color: #64748b; line-height: 1.5; padding-left: 18px; margin: 0; }
		.troubleshoot-box li { margin-bottom: 6px; }
		.troubleshoot-box li:last-child { margin-bottom: 0; }
		.btn-primary { display: block; width: 100%; padding: 12px 20px; background: #0096fa; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; text-align: center; transition: background 0.15s; }
		.btn-primary:hover { background: #0084e0; }
		.footer { height: 60px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; }
	</style>
</head>
<body>
	<nav class="navbar">
		<a href="/" class="brand">Lumiina <span>Illustration & Creator Community</span></a>
	</nav>
	
	<main class="main">
		<div class="container">
			<div class="status-badge">
				<div class="status-dot"></div> Verification Issue
			</div>
			<h1>Activation Link Unavailable</h1>
			<p>` + message + `</p>
			
			<div class="troubleshoot-box">
				<div class="troubleshoot-title">Possible causes:</div>
				<ul>
					<li>Your account was already successfully verified in a previous session.</li>
					<li>The link expiration window (24 hours) has elapsed.</li>
					<li>A newer activation email was requested.</li>
				</ul>
			</div>

			<a href="/login" class="btn-primary">Return to Sign In</a>
		</div>
	</main>

	<footer class="footer">
		&copy; 2026 Lumiina Inc. All rights reserved.
	</footer>
</body>
</html>`
}
