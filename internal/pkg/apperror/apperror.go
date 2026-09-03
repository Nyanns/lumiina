package apperror

import (
	"fmt"
	"net/http"
)

// AppError is the standard structured error for all application domain operations
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new custom AppError
func New(code, message string, status int, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  status,
		Err:     err,
	}
}

// Pre-defined enterprise standard errors
var (
	ErrInvalidCredentials = New("AUTH_INVALID_CREDS", "kombinasi username/email atau password salah", http.StatusUnauthorized, nil)
	ErrUserUnverified     = New("AUTH_UNVERIFIED", "akun Anda belum diverifikasi. Silakan periksa email untuk tautan aktivasi.", http.StatusForbidden, nil)
	ErrUserAlreadyExists  = New("AUTH_USER_EXISTS", "username atau email sudah terdaftar", http.StatusConflict, nil)
	ErrWeakPassword       = New("AUTH_WEAK_PASSWORD", "password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial", http.StatusBadRequest, nil)
	ErrNotFound           = New("NOT_FOUND", "data yang dicari tidak ditemukan", http.StatusNotFound, nil)
	ErrForbidden          = New("FORBIDDEN", "Anda tidak memiliki izin untuk melakukan aksi ini", http.StatusForbidden, nil)
	ErrInternal           = New("INTERNAL_SERVER_ERROR", "terjadi kesalahan internal pada server", http.StatusInternalServerError, nil)
)
