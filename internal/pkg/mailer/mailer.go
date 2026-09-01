package mailer

import (
	"fmt"
	"net/smtp"
)

type MailerService interface {
	SendVerificationEmail(toEmail, username, token, baseURL string) error
	SendPasswordResetEmail(toEmail, username, token, baseURL string) error
}

type mailerService struct {
	host     string
	port     string
	email    string
	password string
}

func NewMailerService(host, port, email, password string) MailerService {
	return &mailerService{
		host:     host,
		port:     port,
		email:    email,
		password: password,
	}
}

func (m *mailerService) sendEmail(toEmail, subject, htmlBody string) error {
	if m.host == "" || m.port == "" || m.email == "" || m.password == "" {
		return fmt.Errorf("SMTP configuration is incomplete: host=%q, port=%q, email=%q, pass_set=%v", m.host, m.port, m.email, m.password != "")
	}

	auth := smtp.PlainAuth("", m.email, m.password, m.host)
	addr := fmt.Sprintf("%s:%s", m.host, m.port)

	// Format MIME Header untuk Email HTML
	header := make(map[string]string)
	header["From"] = fmt.Sprintf("Lumiina Official <%s>", m.email)
	header["To"] = toEmail
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=\"UTF-8\""

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + htmlBody

	return smtp.SendMail(addr, auth, m.email, []string{toEmail}, []byte(message))
}

func (m *mailerService) SendVerificationEmail(toEmail, username, token, baseURL string) error {
	verifyURL := fmt.Sprintf("%s/api/v1/auth/verify-email?token=%s", baseURL, token)
	subject := "Verifikasi Alamat Email Anda | Lumiina"
	htmlBody := buildVerificationEmailHTML(username, verifyURL)

	return m.sendEmail(toEmail, subject, htmlBody)
}

func (m *mailerService) SendPasswordResetEmail(toEmail, username, token, baseURL string) error {
	resetURL := fmt.Sprintf("%s/api/v1/auth/reset-password?token=%s", baseURL, token)
	subject := "Atur Ulang Kata Sandi Akun Lumiina"
	htmlBody := buildPasswordResetEmailHTML(username, resetURL)

	return m.sendEmail(toEmail, subject, htmlBody)
}
