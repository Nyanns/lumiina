package mailer

import (
	"fmt"
	"html"
)

func buildVerificationEmailHTML(username, verifyURL string) string {
	safeUsername := html.EscapeString(username)
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Verify Your Email Address | Lumiina</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
	<table width="100%%" border="0" cellpadding="0" cellspacing="0">
		<tr>
			<td align="center">
				<table width="100%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left;">
					<!-- Brand Header -->
					<tr>
						<td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
							<span style="font-size: 20px; font-weight: 800; color: #0096fa; letter-spacing: -0.5px;">Lumiina</span>
							<span style="font-size: 13px; color: #64748b; margin-left: 6px;">Illustration & Creator Community</span>
						</td>
					</tr>
					<!-- Main Content -->
					<tr>
						<td style="padding: 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Verify Your Email Address</h1>
							<p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
								Hello <strong>%s</strong>,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
								Thank you for joining Lumiina. To begin publishing and exploring anime illustrations across our community, please confirm your email address by clicking the button below:
							</p>

							<!-- Action Button -->
							<table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
								<tr>
									<td align="left">
										<a href="%s" target="_blank" style="background-color: #0096fa; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 9999px; display: inline-block;">
											Verify My Email
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 24px 0 8px; font-size: 13px; color: #64748b;">
								If the button above does not work, copy and paste the following link into your browser:
							</p>
							<div style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; word-break: break-all;">
								%s
							</div>

							<p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
								This link is valid for <strong>24 hours</strong>. If you did not create an account on Lumiina, you can safely disregard this email.
							</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
							&copy; 2026 Lumiina Inc. Illustration & Creator Community Platform.<br>
							This is an automated message. Please do not reply to this email.
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
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Password Reset Request | Lumiina</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
	<table width="100%%%%" border="0" cellpadding="0" cellspacing="0">
		<tr>
			<td align="center">
				<table width="100%%%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left;">
					<!-- Brand Header -->
					<tr>
						<td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
							<span style="font-size: 20px; font-weight: 800; color: #0096fa; letter-spacing: -0.5px;">Lumiina</span>
							<span style="font-size: 13px; color: #64748b; margin-left: 6px;">Account Security</span>
						</td>
					</tr>
					<!-- Main Content -->
					<tr>
						<td style="padding: 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Reset Your Account Password</h1>
							<p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
								Hello <strong>%s</strong>,
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
								We received a request to reset your Lumiina account password. Please click the button below to set up a new password:
							</p>

							<!-- Action Button -->
							<table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
								<tr>
									<td align="left">
										<a href="%s" target="_blank" style="background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 9999px; display: inline-block;">
											Reset Password
										</a>
									</td>
								</tr>
							</table>

							<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #991b1b; margin-bottom: 24px;">
								<strong>Notice:</strong> For security reasons, this link can only be used once and expires in <strong>15 minutes</strong>.
							</div>

							<p style="margin: 24px 0 8px; font-size: 13px; color: #64748b;">
								If the button above does not work, copy and paste the following link into your browser:
							</p>
							<div style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; word-break: break-all;">
								%s
							</div>

							<p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
								If you did not request a password reset, your account remains secure and no further action is required.
							</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
							&copy; 2026 Lumiina Inc. Illustration & Creator Community Platform.<br>
							This security notification was sent automatically. Please do not reply to this email.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`, safeUsername, resetURL, resetURL)
}
