package mailer

import (
	"fmt"
	"html"
)

func buildVerificationEmailHTML(username, verifyURL string) string {
	safeUsername := html.EscapeString(username)
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verifikasi Alamat Email | Lumiina</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
	<table width="100%%" border="0" cellpadding="0" cellspacing="0">
		<tr>
			<td align="center">
				<table width="100%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left;">
					<!-- Brand Header -->
					<tr>
						<td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
							<span style="font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px;">Lumiina</span>
							<span style="font-size: 13px; color: #64748b; margin-left: 6px;">Fan Art Community</span>
						</td>
					</tr>
					<!-- Main Content -->
					<tr>
						<td style="padding: 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Verifikasi Alamat Email Anda</h1>
							<p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
								Halo <strong>%s</strong>,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
								Terima kasih telah mendaftar di Lumiina. Untuk mulai membagikan dan menikmati karya seni anime dari komunitas kami, silakan konfirmasi bahwa ini adalah alamat email Anda dengan mengeklik tombol di bawah ini:
							</p>

							<!-- Action Button -->
							<table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
								<tr>
									<td align="left">
										<a href="%s" target="_blank" style="background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
											Verifikasi Email Saya
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 24px 0 8px; font-size: 13px; color: #64748b;">
								Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:
							</p>
							<div style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; word-break: break-all;">
								%s
							</div>

							<p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
								Tautan ini berlaku selama <strong>24 jam</strong>. Jika Anda merasa tidak pernah mendaftar di Lumiina, Anda dapat mengabaikan email ini dengan aman.
							</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
							&copy; 2026 Lumiina Inc. Platform Komunitas Berbagi Seni Anime.<br>
							Email ini dikirim secara otomatis untuk memvalidasi akun Anda. Mohon tidak membalas email ini.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`, safeUsername, verifyURL, verifyURL)
}

func buildPasswordResetEmailHTML(username, resetURL string) string {
	safeUsername := html.EscapeString(username)
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Permintaan Atur Ulang Kata Sandi | Lumiina</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
	<table width="100%%%%" border="0" cellpadding="0" cellspacing="0">
		<tr>
			<td align="center">
				<table width="100%%%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left;">
					<!-- Brand Header -->
					<tr>
						<td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
							<span style="font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px;">Lumiina</span>
							<span style="font-size: 13px; color: #64748b; margin-left: 6px;">Keamanan Akun</span>
						</td>
					</tr>
					<!-- Main Content -->
					<tr>
						<td style="padding: 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Atur Ulang Kata Sandi Akun</h1>
							<p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
								Halo <strong>%s</strong>,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
								Kami menerima permintaan untuk mengatur ulang kata sandi akun Lumiina Anda. Silakan klik tombol di bawah ini untuk membuat kata sandi baru:
							</p>

							<!-- Action Button -->
							<table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
								<tr>
									<td align="left">
										<a href="%s" target="_blank" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
											Atur Ulang Kata Sandi
										</a>
									</td>
								</tr>
							</table>

							<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #991b1b; margin-bottom: 24px;">
								<strong>Perhatian:</strong> Demi alasan keamanan, tautan ini hanya dapat digunakan satu kali dan akan kedaluwarsa dalam <strong>15 menit</strong>.
							</div>

							<p style="margin: 24px 0 8px; font-size: 13px; color: #64748b;">
								Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di peramban Anda:
							</p>
							<div style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; word-break: break-all;">
								%s
							</div>

							<p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
								Jika Anda tidak pernah meminta perubahan kata sandi, akun Anda tetap aman dan tidak ada tindakan lebih lanjut yang diperlukan.
							</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
							&copy; 2026 Lumiina Inc. Platform Komunitas Berbagi Seni Anime.<br>
							Email keamanan ini dikirimkan secara otomatis. Mohon tidak membalas email ini.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`, safeUsername, resetURL, resetURL)
}
