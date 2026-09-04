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
	ErrInvalidCredentials = New("AUTH_INVALID_CREDS", "Invalid username/email or password combination.", http.StatusUnauthorized, nil)
	ErrUserUnverified     = New("AUTH_UNVERIFIED", "Your account is not verified yet. Please check your email for the activation link.", http.StatusForbidden, nil)
	ErrUserAlreadyExists  = New("AUTH_USER_EXISTS", "Username or email is already registered.", http.StatusConflict, nil)
	ErrWeakPassword       = New("AUTH_WEAK_PASSWORD", "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.", http.StatusBadRequest, nil)
	ErrNotFound           = New("NOT_FOUND", "The requested resource was not found.", http.StatusNotFound, nil)
	ErrForbidden          = New("FORBIDDEN", "You do not have permission to perform this action.", http.StatusForbidden, nil)
	ErrInternal           = New("INTERNAL_SERVER_ERROR", "An internal server error occurred.", http.StatusInternalServerError, nil)
)
